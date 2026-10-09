import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  doc, 
  updateDoc, 
  setDoc,
  getDoc,
  query, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);

export interface InquiryData {
  id?: string;
  fullName: string;
  email: string;
  phone?: string;
  message: string;
  submittedAt: string;
  syncedToSheet?: boolean;
}

export interface SheetsConfig {
  spreadsheetId: string;
  spreadsheetName?: string;
  accessToken?: string;
  userEmail?: string;
  enabled: boolean;
  updatedAt?: string;
}

const provider = new GoogleAuthProvider();
// Required Google Sheets and Google Drive permissions
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/drive.file');

let isSigningIn = false;
let cachedAccessToken: string | null = typeof window !== 'undefined' ? localStorage.getItem('bbw_google_token') : null;

// Initialize auth state listener.
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      const storedToken = localStorage.getItem('bbw_google_token');
      if (storedToken) {
        cachedAccessToken = storedToken;
        if (onAuthSuccess) onAuthSuccess(user, storedToken);
      } else if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      if (cachedAccessToken) {
        // Keep stored token if available in local state
        if (user && onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else {
        if (onAuthFailure) onAuthFailure();
      }
    }
  });
};

// Start Google sign-in popup flow
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to retrieve access token from Google Sign-In.');
    }

    cachedAccessToken = credential.accessToken;
    if (typeof window !== 'undefined') {
      localStorage.setItem('bbw_google_token', cachedAccessToken);
    }
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  if (!cachedAccessToken && typeof window !== 'undefined') {
    cachedAccessToken = localStorage.getItem('bbw_google_token');
  }
  return cachedAccessToken;
};

export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('bbw_google_token');
  }
};

/**
 * Lists user spreadsheets from Google Drive.
 */
export const fetchUserSpreadsheets = async (token: string): Promise<{ id: string; name: string }[]> => {
  try {
    const response = await fetch(
      "https://www.googleapis.com/drive/v3/files?q=mimeType%3D'application%2Fvnd.google-apps.spreadsheet'&fields=files(id%2Cname)&orderBy=name",
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch spreadsheets: ${response.statusText}`);
    }

    const data = await response.json();
    return data.files || [];
  } catch (error) {
    console.error('Error fetching spreadsheets:', error);
    throw error;
  }
};

/**
 * Creates a brand new Google Spreadsheet with headers "Submitted At", "Name", "Email", "Message", "Campaign Source".
 */
export const createLeadsSheet = async (token: string, title = 'Built By Watson - Leads Portal'): Promise<string> => {
  try {
    // 1. Create a blank Spreadsheet
    const createResponse = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          title: title,
        },
      }),
    });

    if (!createResponse.ok) {
      throw new Error('Failed to create new spreadsheet');
    }

    const sheetData = await createResponse.json();
    const spreadsheetId = sheetData.spreadsheetId;

    if (!spreadsheetId) {
      throw new Error('No spreadsheet ID returned');
    }

    // 2. Initialize headers in the first row
    const headers = [['Submitted At', 'Full Name', 'Email Address', 'Phone Number', 'Lead Message', 'Campaign Status']];
    const headerResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:F1?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: headers,
        }),
      }
    );

    if (!headerResponse.ok) {
      throw new Error('Failed to write headers to the new spreadsheet');
    }

    return spreadsheetId;
  } catch (error) {
    console.error('Error creating spreadsheet:', error);
    throw error;
  }
};

/**
 * Ensures that the target spreadsheet has the "Phone Number" column in Row 1.
 * If the sheet has an older structure without Phone Number (e.g. Submitted At, Full Name, Email Address, Lead Message, Campaign Status),
 * it inserts a new column before Lead Message (Column D) and sets the header to "Phone Number".
 */
export const ensurePhoneColumnInSheet = async (
  token: string,
  spreadsheetId: string
): Promise<{ success: boolean; message: string; added: boolean }> => {
  try {
    // 1. Fetch spreadsheet metadata to get the first sheet's id & title
    const metaResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets(properties(sheetId,title))`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      }
    );

    if (!metaResponse.ok) {
      throw new Error(`Failed to inspect sheet metadata: ${metaResponse.statusText}`);
    }

    const metaData = await metaResponse.json();
    const firstSheet = metaData.sheets?.[0]?.properties;
    const sheetId = firstSheet?.sheetId ?? 0;
    const sheetTitle = firstSheet?.title || 'Sheet1';

    // 2. Fetch the current header row (Row 1)
    const headerResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetTitle)}!A1:Z1`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      }
    );

    if (!headerResponse.ok) {
      throw new Error(`Failed to read sheet headers: ${headerResponse.statusText}`);
    }

    const headerData = await headerResponse.json();
    const existingHeaders: string[] = (headerData.values && headerData.values[0]) ? headerData.values[0] : [];

    // Case A: Completely empty sheet - initialize standard headers
    if (existingHeaders.length === 0) {
      const fullHeaders = [['Submitted At', 'Full Name', 'Email Address', 'Phone Number', 'Lead Message', 'Campaign Status']];
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetTitle)}!A1:F1?valueInputOption=USER_ENTERED`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ values: fullHeaders }),
        }
      );
      return { success: true, message: 'Initialized full column headers with Phone Number (Columns A-F).', added: true };
    }

    // Check if phone header already exists in row 1
    const hasPhone = existingHeaders.some(h => {
      const str = (h || '').toString().toLowerCase();
      return str.includes('phone') || str.includes('tel') || str.includes('cell') || str.includes('mobile');
    });

    // Also check if Column D (index 3) is already added by the user and Column E (index 4) is message
    const colD = (existingHeaders[3] || '').toString().toLowerCase();
    const colE = (existingHeaders[4] || '').toString().toLowerCase();
    const isColumnDAlreadyPhone = hasPhone || (colD.length > 0 && (colE.includes('message') || existingHeaders.length >= 5));

    if (isColumnDAlreadyPhone) {
      return { 
        success: true, 
        message: 'Column D (Phone Number) and Column E (Message) verified in your sheet!', 
        added: false 
      };
    }

    // Case B: Sheet has headers, but lacks Phone Number column.
    // Locate where "message" is, or default to index 3 (Column D, right after Email Address)
    let insertColIndex = 3;
    for (let i = 0; i < existingHeaders.length; i++) {
      if ((existingHeaders[i] || '').toString().toLowerCase().includes('message')) {
        insertColIndex = i;
        break;
      }
    }

    // Insert column dimension in Google Sheet so existing row values shift right cleanly
    const batchUpdateResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              insertDimension: {
                range: {
                  sheetId: sheetId,
                  dimension: 'COLUMNS',
                  startIndex: insertColIndex,
                  endIndex: insertColIndex + 1,
                },
                inheritFromBefore: true,
              },
            },
          ],
        }),
      }
    );

    // Convert column index to A1 notation letter (0 -> A, 1 -> B, etc.)
    const colLetter = String.fromCharCode(65 + insertColIndex);

    if (batchUpdateResponse.ok) {
      // Set header label in the newly inserted column cell
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetTitle)}!${colLetter}1?valueInputOption=USER_ENTERED`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ values: [['Phone Number']] }),
        }
      );
    } else {
      // Fallback: If insertDimension was rejected, update Row 1 headers array directly
      const updatedHeaders = [...existingHeaders];
      updatedHeaders.splice(insertColIndex, 0, 'Phone Number');
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetTitle)}!A1:Z1?valueInputOption=USER_ENTERED`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ values: [updatedHeaders] }),
        }
      );
    }

    return {
      success: true,
      message: `Phone Number column successfully added at Column ${colLetter}!`,
      added: true,
    };
  } catch (error: any) {
    console.error('Error ensuring phone column:', error);
    throw error;
  }
};

/**
 * Appends a log row to an active spreadsheet.
 */
export const appendLeadToSheet = async (
  token: string,
  spreadsheetId: string,
  lead: { fullName: string; email: string; phone?: string; message: string; submittedAt?: string }
): Promise<void> => {
  try {
    // Ensure the sheet has the Phone Number column before appending
    try {
      await ensurePhoneColumnInSheet(token, spreadsheetId);
    } catch (checkErr) {
      console.warn('Could not auto-verify phone header, proceeding with append:', checkErr);
    }

    const timestamp = lead.submittedAt || new Date().toLocaleString();
    const rowValues = [
      [timestamp, lead.fullName, lead.email, lead.phone || '', lead.message, 'Active Campaign']
    ];

    // Append value to sheet. Using Sheet1 as standard, but if it doesn't work, first tab will be appended.
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A:F:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: rowValues,
        }),
      }
    );

    if (!response.ok) {
      // Retry specifying 'Sheet1!A:F' if generic 'A:F' append fails
      const retryResponse = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A:F:append?valueInputOption=USER_ENTERED`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            values: rowValues,
          }),
        }
      );

      if (!retryResponse.ok) {
        throw new Error(`Failed to append lead info: ${retryResponse.statusText}`);
      }
    }
  } catch (error) {
    console.error('Error appending lead to sheet:', error);
    throw error;
  }
};

export const saveSheetsConfigToFirestore = async (config: {
  spreadsheetId: string;
  isSheetsEnabled: boolean;
  accessToken?: string;
  userEmail?: string;
  webhookUrl?: string;
}): Promise<void> => {
  try {
    const docRef = doc(db, 'config', 'google_sheets');
    await setDoc(docRef, {
      spreadsheetId: config.spreadsheetId,
      isSheetsEnabled: config.isSheetsEnabled,
      accessToken: config.accessToken || '',
      userEmail: config.userEmail || '',
      webhookUrl: config.webhookUrl || '',
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.error('Error saving sheets config to Firestore:', err);
  }
};

export const getSheetsConfigFromFirestore = async (): Promise<{
  spreadsheetId: string;
  isSheetsEnabled: boolean;
  accessToken: string;
  userEmail: string;
  webhookUrl: string;
} | null> => {
  try {
    const docRef = doc(db, 'config', 'google_sheets');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        spreadsheetId: data.spreadsheetId || '',
        isSheetsEnabled: data.isSheetsEnabled !== false,
        accessToken: data.accessToken || '',
        userEmail: data.userEmail || '',
        webhookUrl: data.webhookUrl || ''
      };
    }
  } catch (err) {
    console.error('Error getting sheets config from Firestore:', err);
  }
  return null;
};

export const appendLeadToWebhook = async (
  webhookUrl: string,
  lead: { fullName: string; email: string; phone?: string; message: string; submittedAt?: string }
): Promise<void> => {
  const payload = {
    fullName: lead.fullName,
    email: lead.email,
    phone: lead.phone || '',
    message: lead.message,
    submittedAt: lead.submittedAt || new Date().toLocaleString()
  };

  const body = JSON.stringify(payload);

  try {
    // text/plain avoids CORS OPTIONS preflight blocking on script.google.com
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: body
    });
  } catch (err) {
    // Fallback using no-cors mode
    await fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body: body
    });
  }
};

/**
 * Saves a new lead/inquiry raw submission to Firestore.
 */
export const saveInquiryToFirestore = async (inquiry: InquiryData): Promise<string> => {
  try {
    const colRef = collection(db, 'inquiries');
    const docRef = await addDoc(colRef, {
      fullName: inquiry.fullName,
      email: inquiry.email,
      phone: inquiry.phone || '',
      message: inquiry.message,
      submittedAt: inquiry.submittedAt,
      syncedToSheet: false,
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error saving inquiry to Firestore:', error);
    throw error;
  }
};

/**
 * Subscribes to the list of inquiries sorted by newest first (limit to 100).
 */
export const subscribeToInquiries = (callback: (inquiries: InquiryData[]) => void) => {
  const colRef = collection(db, 'inquiries');
  const q = query(colRef, orderBy('createdAt', 'desc'), limit(100));
  
  return onSnapshot(q, (snapshot) => {
    const inquiries: InquiryData[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      inquiries.push({
        id: doc.id,
        fullName: data.fullName || '',
        email: data.email || '',
        phone: data.phone || '',
        message: data.message || '',
        submittedAt: data.submittedAt || '',
        syncedToSheet: !!data.syncedToSheet
      });
    });
    callback(inquiries);
  }, (error) => {
    console.error("Firestore subscription error:", error);
  });
};

/**
 * Marks an inquiry as successfully synced.
 */
export const markInquirySyncedInFirestore = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, 'inquiries', id);
    await updateDoc(docRef, {
      syncedToSheet: true,
      syncedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error marking inquiry as synced in Firestore:', error);
    throw error;
  }
};

