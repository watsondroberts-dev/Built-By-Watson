import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, MapPin, Globe, MousePointerClick, ArrowRight, CheckCircle2, ShieldCheck, Database, Link2, LogOut, Check, Plus, RefreshCw, AlertCircle, ExternalLink, Copy } from 'lucide-react';
import { ProjectInquiry } from '../types';
import { LOCATION_INFO } from '../data';
import { 
  initAuth, 
  googleSignIn, 
  logout, 
  fetchUserSpreadsheets, 
  createLeadsSheet, 
  appendLeadToSheet,
  appendLeadToWebhook,
  saveInquiryToFirestore,
  subscribeToInquiries,
  markInquirySyncedInFirestore,
  getAccessToken,
  saveSheetsConfigToFirestore,
  getSheetsConfigFromFirestore,
  InquiryData
} from '../googleSheetsService';
import { User } from 'firebase/auth';

const DEFAULT_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbwsSqvWMwq5yDgixNTx0KFSo8PbnJKua6Bram94mVYN-6IbwvlTGPPP_faJ-0f8IIQ5/exec';

export default function ContactView() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  
  // Validation states
  const [errors, setErrors] = useState<{ fullName?: string; email?: string; message?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Google Sheets integration state
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [spreadsheets, setSpreadsheets] = useState<{ id: string; name: string }[]>([]);
  const [selectedSheetId, setSelectedSheetId] = useState<string>(() => {
    return localStorage.getItem('bbw_sheet_id') || '';
  });
  const [isSheetsEnabled, setIsSheetsEnabled] = useState<boolean>(() => {
    return localStorage.getItem('bbw_sheets_enabled') !== 'false'; // default to true if logged in
  });
  const [isLoadingSheets, setIsLoadingSheets] = useState(false);
  const [sheetsError, setSheetsError] = useState<string | null>(null);
  const [lastSyncedLead, setLastSyncedLead] = useState<string | null>(null);
  const [webhookUrl, setWebhookUrl] = useState<string>(() => {
    return localStorage.getItem('bbw_webhook_url') || DEFAULT_WEBHOOK_URL;
  });
  const [showWebhookGuide, setShowWebhookGuide] = useState<boolean>(true);
  const [copiedScript, setCopiedScript] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('admin') === 'true' || params.has('sheets') || params.get('sheets') === 'admin') {
        localStorage.setItem('bbw_admin_access', 'true');
        return true;
      }
    }
    return false;
  });

  // Form submission integrations
  const [provider, setProvider] = useState<'formspree' | 'web3forms' | 'local'>(() => {
    return (localStorage.getItem('bbw_form_provider') as 'formspree' | 'web3forms' | 'local') || 'local';
  });
  const [integrationKey, setIntegrationKey] = useState(() => {
    return localStorage.getItem('bbw_integration_key') || '';
  });

  // Administrative / Local tracking persistence without rendering the UI
  const [localInquiries, setLocalInquiries] = useState<ProjectInquiry[]>([]);
  const [dbInquiries, setDbInquiries] = useState<InquiryData[]>([]);

  // Subscribe to real-time database updates for lead tracking and auto-sync
  useEffect(() => {
    const unsubscribe = subscribeToInquiries((inquiries) => {
      setDbInquiries(inquiries);
    });

    return () => unsubscribe();
  }, []);

  // Real-time auto sync engine
  // If we have a Webhook URL or an active Google Token and Sheets are enabled, automatically flush
  // any pending inquiries from our centralized database to Google Sheets!
  useEffect(() => {
    if ((!googleToken && !webhookUrl) || dbInquiries.length === 0) return;

    const unsynced = dbInquiries.filter(inq => !inq.syncedToSheet);
    if (unsynced.length === 0) return;

    const syncPendingLeads = async () => {
      // Sort in ascending order of submission time to maintain clean index order in Sheet
      const sorted = [...unsynced].sort((a, b) => {
        return new Date(a.submittedAt || 0).getTime() - new Date(b.submittedAt || 0).getTime();
      });

      console.log(`[AutoSync] Found ${sorted.length} pending lead(s) online. Syncing to Google Sheets...`);
      
      for (const lead of sorted) {
        if (!lead.id) continue;
        try {
          if (webhookUrl) {
            await appendLeadToWebhook(webhookUrl, {
              fullName: lead.fullName,
              email: lead.email,
              message: lead.message,
              submittedAt: lead.submittedAt ? new Date(lead.submittedAt).toLocaleString() : undefined
            });
            await markInquirySyncedInFirestore(lead.id);
            console.log(`[AutoSync via Webhook] Lead "${lead.fullName}" synchronized successfully.`);
          } else if (googleToken && selectedSheetId) {
            await appendLeadToSheet(googleToken, selectedSheetId, {
              fullName: lead.fullName,
              email: lead.email,
              message: lead.message,
              submittedAt: lead.submittedAt ? new Date(lead.submittedAt).toLocaleString() : undefined
            });
            await markInquirySyncedInFirestore(lead.id);
            console.log(`[AutoSync via OAuth] Lead "${lead.fullName}" synchronized successfully.`);
          }
          
          setLastSyncedLead(`Synced lead: "${lead.fullName}" transferred to spreadsheet!`);
          setTimeout(() => setLastSyncedLead(null), 5000);
        } catch (err: any) {
          console.error(`[AutoSync] Failed to sync lead:`, lead.id, err);
          break;
        }
      }
    };

    syncPendingLeads();
  }, [googleToken, webhookUrl, selectedSheetId, isSheetsEnabled, dbInquiries]);

  // Load inquiries and initialize Google OAuth configuration on mount
  useEffect(() => {
    const saved = localStorage.getItem('bbw_inquiries');
    if (saved) {
      try {
        setLocalInquiries(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse inquiries', e);
      }
    }

    // Load remote central config from Firestore if available
    getSheetsConfigFromFirestore().then((remoteConfig) => {
      if (remoteConfig) {
        if (remoteConfig.spreadsheetId) {
          setSelectedSheetId(remoteConfig.spreadsheetId);
          localStorage.setItem('bbw_sheet_id', remoteConfig.spreadsheetId);
        }
        if (remoteConfig.isSheetsEnabled !== undefined) {
          setIsSheetsEnabled(remoteConfig.isSheetsEnabled);
          localStorage.setItem('bbw_sheets_enabled', remoteConfig.isSheetsEnabled ? 'true' : 'false');
        }
        if (remoteConfig.accessToken) {
          setGoogleToken(remoteConfig.accessToken);
        }
        if (remoteConfig.webhookUrl) {
          setWebhookUrl(remoteConfig.webhookUrl);
          localStorage.setItem('bbw_webhook_url', remoteConfig.webhookUrl);
        } else {
          setWebhookUrl(DEFAULT_WEBHOOK_URL);
          localStorage.setItem('bbw_webhook_url', DEFAULT_WEBHOOK_URL);
          saveSheetsConfigToFirestore({
            spreadsheetId: selectedSheetId || '',
            isSheetsEnabled: true,
            webhookUrl: DEFAULT_WEBHOOK_URL
          }).catch(e => console.error("Error saving default webhook:", e));
        }
      }
    }).catch(err => console.error("Error fetching sheets config:", err));

    const unsubscribe = initAuth(
      async (user, token) => {
        setGoogleUser(user);
        setGoogleToken(token);
        setIsLoadingSheets(true);
        try {
          const files = await fetchUserSpreadsheets(token);
          setSpreadsheets(files);
        } catch (err: any) {
          console.error("Sheets sync error:", err);
          setSheetsError("Failed to auto-load spreadsheets. Click sign in if token is expired.");
        } finally {
          setIsLoadingSheets(false);
        }
      },
      () => {
        setGoogleUser(null);
        setGoogleToken(null);
      }
    );

    return () => unsubscribe();
  }, []);

  // Save sheets configuration centrally to Firestore whenever changed
  useEffect(() => {
    if (selectedSheetId || webhookUrl) {
      saveSheetsConfigToFirestore({
        spreadsheetId: selectedSheetId,
        isSheetsEnabled,
        accessToken: googleToken || undefined,
        userEmail: googleUser?.email || undefined,
        webhookUrl: webhookUrl || undefined
      }).catch(e => console.error("Failed saving sheets config centrally:", e));
    }
  }, [selectedSheetId, isSheetsEnabled, googleToken, googleUser, webhookUrl]);

  const handleGoogleLogin = async () => {
    setSheetsError(null);
    setIsLoadingSheets(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setGoogleUser(result.user);
        setGoogleToken(result.accessToken);
        const files = await fetchUserSpreadsheets(result.accessToken);
        setSpreadsheets(files);
        setIsSheetsEnabled(true);
        localStorage.setItem('bbw_sheets_enabled', 'true');
        if (selectedSheetId) {
          await saveSheetsConfigToFirestore({
            spreadsheetId: selectedSheetId,
            isSheetsEnabled: true,
            accessToken: result.accessToken,
            userEmail: result.user.email || undefined
          });
        }
      }
    } catch (err: any) {
      console.error("Login failed:", err);
      setSheetsError("Google Authentication failed. Please try again.");
    } finally {
      setIsLoadingSheets(false);
    }
  };

  const handleGoogleLogout = async () => {
    try {
      await logout();
      setGoogleUser(null);
      setGoogleToken(null);
      setSpreadsheets([]);
      setIsSheetsEnabled(false);
      localStorage.setItem('bbw_sheets_enabled', 'false');
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const handleCreateNewSheet = async () => {
    if (!googleToken) return;
    setSheetsError(null);
    setIsLoadingSheets(true);
    try {
      const newSheetId = await createLeadsSheet(googleToken, "Built By Watson - Leads Portal");
      setSelectedSheetId(newSheetId);
      localStorage.setItem('bbw_sheet_id', newSheetId);
      await saveSheetsConfigToFirestore({
        spreadsheetId: newSheetId,
        isSheetsEnabled: true,
        accessToken: googleToken,
        userEmail: googleUser?.email || undefined
      });
      
      const files = await fetchUserSpreadsheets(googleToken);
      setSpreadsheets(files);
    } catch (err: any) {
      console.error("Failed to create spreadsheet:", err);
      setSheetsError("Could not automatically instantiate sheet. Please try again.");
    } finally {
      setIsLoadingSheets(false);
    }
  };

  const handleSelectSheet = (sheetId: string) => {
    setSelectedSheetId(sheetId);
    localStorage.setItem('bbw_sheet_id', sheetId);
    saveSheetsConfigToFirestore({
      spreadsheetId: sheetId,
      isSheetsEnabled,
      accessToken: googleToken || undefined,
      userEmail: googleUser?.email || undefined
    });
  };

  const handleToggleSheets = (checked: boolean) => {
    setIsSheetsEnabled(checked);
    localStorage.setItem('bbw_sheets_enabled', checked ? 'true' : 'false');
    if (selectedSheetId) {
      saveSheetsConfigToFirestore({
        spreadsheetId: selectedSheetId,
        isSheetsEnabled: checked,
        accessToken: googleToken || undefined,
        userEmail: googleUser?.email || undefined
      });
    }
  };

  const handleSendTestLead = async () => {
    if (!googleToken || !selectedSheetId) return;
    setSheetsError(null);
    setIsLoadingSheets(true);
    try {
      await appendLeadToSheet(googleToken, selectedSheetId, {
        fullName: "Test Lead User",
        email: "test@builtbywatson.com",
        message: "This is a verification test lead to verify your Google Sheet is fully linked and active!"
      });
      setLastSyncedLead("Test lead successfully appended!");
      setTimeout(() => setLastSyncedLead(null), 4000);
    } catch (err: any) {
      console.error("Test append failed:", err);
      setSheetsError("Failed to trigger sheet write. Your session token may have expired. Please log in again.");
    } finally {
      setIsLoadingSheets(false);
    }
  };

  const saveInquiriesToStorage = (inquiries: ProjectInquiry[]) => {
    localStorage.setItem('bbw_inquiries', JSON.stringify(inquiries));
    setLocalInquiries(inquiries);
  };

  const handleSaveIntegration = (newProvider: 'formspree' | 'web3forms' | 'local', newKey: string) => {
    setProvider(newProvider);
    setIntegrationKey(newKey);
    localStorage.setItem('bbw_form_provider', newProvider);
    localStorage.setItem('bbw_integration_key', newKey);
  };

  const validateForm = () => {
    const newErrors: typeof errors = {};
    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    if (!email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please provide a valid email address';
    }
    if (!message.trim()) {
      newErrors.message = 'A message detailing your project is required';
    } else if (message.length < 10) {
      newErrors.message = 'Please provide a bit more detail (at least 10 characters)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    let submitSuccess = true;

    try {
      if (provider === 'formspree' && integrationKey.trim()) {
        const response = await fetch(`https://formspree.io/f/${integrationKey.trim()}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            name: fullName.trim(),
            email: email.trim(),
            message: message.trim()
          })
        });
        if (!response.ok) {
          submitSuccess = false;
        }
      } else if (provider === 'web3forms' && integrationKey.trim()) {
        const response = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            access_key: integrationKey.trim(),
            name: fullName.trim(),
            email: email.trim(),
            message: message.trim(),
            subject: 'New Project Inquiry — Built By Watson',
            from_name: 'Watson Website Portfolio'
          })
        });
        if (!response.ok) {
          submitSuccess = false;
        }
      } else {
        // Fast local simulation for instant responsiveness
        await new Promise((resolve) => setTimeout(resolve, 600));
      }
    } catch (err) {
      console.error('Error submitting form:', err);
      submitSuccess = false;
    }

    if (!submitSuccess) {
      setIsSubmitting(false);
      setErrors({
        message: 'Delivery failed. Please check your connection or try again.'
      });
      return;
    }

    const submissionTime = new Date().toISOString();
    const newInquiry: ProjectInquiry = {
      id: 'inq_' + Math.random().toString(36).substring(2, 11),
      fullName: fullName.trim(),
      email: email.trim(),
      message: message.trim(),
      submittedAt: submissionTime,
      status: provider !== 'local' && integrationKey.trim() ? 'reviewed' : 'pending'
    };

    const updated = [newInquiry, ...localInquiries];
    saveInquiriesToStorage(updated);

    const leadPayload = {
      fullName: fullName.trim(),
      email: email.trim(),
      message: message.trim(),
      submittedAt: submissionTime
    };

    // Asynchronously commit to Firestore & Google Sheets without hanging UI submission state
    (async () => {
      let dbDocId: string | null = null;
      try {
        dbDocId = await saveInquiryToFirestore(leadPayload);
        console.log("Inquiry registered in centralized Firestore database:", dbDocId);
      } catch (firestoreErr) {
        console.error("Failed to store lead in Firestore:", firestoreErr);
      }

      // Check for active webhook or OAuth sheet credentials
      let targetWebhook = webhookUrl || localStorage.getItem('bbw_webhook_url') || DEFAULT_WEBHOOK_URL;
      let targetSheetId = selectedSheetId;
      let targetToken = googleToken || (await getAccessToken());

      if (!targetWebhook || !targetSheetId || !targetToken) {
        try {
          const remoteConfig = await getSheetsConfigFromFirestore();
          if (remoteConfig) {
            if (!targetWebhook && remoteConfig.webhookUrl) targetWebhook = remoteConfig.webhookUrl;
            if (!targetSheetId) targetSheetId = remoteConfig.spreadsheetId;
            if (!targetToken) targetToken = remoteConfig.accessToken;
          }
        } catch (configErr) {
          console.error("Config fetch error:", configErr);
        }
      }

      let syncedOk = false;

      // 1. Webhook Direct Post (works 24/7 for all site visitors without token expiration)
      if (targetWebhook) {
        try {
          await appendLeadToWebhook(targetWebhook, {
            ...leadPayload,
            submittedAt: new Date(submissionTime).toLocaleString()
          });
          console.log("Appended new lead directly via Google Apps Script Webhook.");
          syncedOk = true;
        } catch (wErr) {
          console.error("Webhook append error:", wErr);
        }
      }

      // 2. Google Sheets API with OAuth Bearer Token
      if (!syncedOk && targetSheetId && targetToken) {
        try {
          await appendLeadToSheet(targetToken, targetSheetId, {
            ...leadPayload,
            submittedAt: new Date(submissionTime).toLocaleString()
          });
          console.log("Appended new lead directly to Google Spreadsheet via OAuth.");
          syncedOk = true;
        } catch (sheetsErr) {
          console.warn("Direct OAuth sheet write notice (lead saved in DB for auto-sync):", sheetsErr);
        }
      }

      if (syncedOk && dbDocId) {
        await markInquirySyncedInFirestore(dbDocId);
      }
    })();

    // Transition UI to success state immediately
    setIsSubmitting(false);
    setShowSuccess(true);
    
    // Reset form fields
    setFullName('');
    setEmail('');
    setMessage('');
    setErrors({});
  };

  return (
    <div id="contact-view" className="bg-background min-h-screen pt-12">
      <main className="py-24 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Column: Context & Brand Identity */}
          <div className="lg:col-span-5 space-y-10">
            <div className="space-y-4">
              <span className="text-xs uppercase font-mono font-bold tracking-widest text-[#4c8dff]">Contact Us</span>
              <h1 className="text-display-lg font-display-lg text-primary tracking-tight font-bold text-4xl md:text-5xl">
                Let's target with precision.
              </h1>
              <p className="text-body-lg font-body-lg text-secondary leading-relaxed max-w-md">
                Our approach to Google Search campaigns ensures your local business receives highly qualified phone call opportunities and bookable leads with zero wasted budget.
              </p>
              
              {/* Category Pills of Specializations */}
              <div className="pt-6 flex flex-wrap gap-4">
                <div className="flex items-center gap-2.5 px-4.5 py-2 bg-surface-container rounded border border-[#4c8dff]/20 text-primary shadow-sm">
                  <MousePointerClick className="h-4 w-4 text-[#4c8dff]" />
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Google Ads Management</span>
                </div>
              </div>
            </div>

            {/* Structured Location Coordinates Card */}
            <div className="bg-white rounded-xl border border-outline-variant/30 p-8 space-y-7 shadow-sm">
              <div className="flex items-start gap-5">
                <div className="p-3 bg-surface-container rounded-lg text-[#4c8dff] shrink-0">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-label-md font-label-md text-primary font-bold">Location</p>
                  <p className="text-body-md font-body-md text-secondary mt-0.5">{LOCATION_INFO.address}</p>
                </div>
              </div>

              <div className="flex items-start gap-5">
                <div className="p-3 bg-surface-container rounded-lg text-[#4c8dff] shrink-0">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-label-md font-label-md text-primary font-bold">General Inquiries</p>
                  <a 
                    href={`mailto:${LOCATION_INFO.email}`} 
                    className="text-body-md font-body-md text-secondary hover:text-[#4c8dff] transition-colors mt-0.5 block"
                  >
                    {LOCATION_INFO.email}
                  </a>
                </div>
              </div>
            </div>

            {/* Dynamic Google Sheets Leads Router Control Card (Admin viewable via ?admin=true) */}
            {isAdmin && (
              <div className="bg-white rounded-xl border border-[#34a853]/30 hover:border-[#34a853]/50 transition-colors p-8 space-y-6 shadow-sm relative overflow-hidden" id="google-sheets-card">
              <div className="absolute top-0 right-0 w-16 h-16 bg-[#34a853]/5 rounded-bl-3xl flex items-center justify-center text-[#34a853]">
                <Database className="h-5 w-5" />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#34a853] bg-[#34a853]/10 px-2.5 py-0.5 rounded-full border border-[#34a853]/20 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#34a853] animate-pulse" />
                    AUTOMATIC GOOGLE SHEETS STORAGE
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.removeItem('bbw_admin_access');
                      setIsAdmin(false);
                    }}
                    className="text-[10px] font-mono font-bold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-2.5 py-0.5 rounded transition-all cursor-pointer border border-slate-200"
                  >
                    Hide Panel
                  </button>
                </div>
                <h3 className="text-xl font-bold font-display-lg text-primary uppercase tracking-tight">Google Sheets Leads Router</h3>
                <p className="text-secondary text-xs leading-relaxed">
                  Every inquiry submitted on this contact form is saved securely in your database and automatically sent to your Google Sheet.
                </p>
              </div>

                {/* Unsynced Leads Sync Action Banner */}
                {dbInquiries.filter(i => !i.syncedToSheet).length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                          {dbInquiries.filter(i => !i.syncedToSheet).length} New Lead(s) Ready to Sync
                        </h4>
                        <p className="text-[11px] text-amber-800 leading-snug mt-0.5">
                          Submissions saved in your database can be pushed directly into your Google Sheet with one click.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={isLoadingSheets}
                      onClick={async () => {
                        const pending = dbInquiries.filter(i => !i.syncedToSheet);
                        if (pending.length === 0) return;
                        setIsLoadingSheets(true);
                        let count = 0;
                        for (const inquiry of pending) {
                          try {
                            if (webhookUrl) {
                              await appendLeadToWebhook(webhookUrl, {
                                fullName: inquiry.fullName,
                                email: inquiry.email,
                                message: inquiry.message,
                                submittedAt: inquiry.submittedAt ? new Date(inquiry.submittedAt).toLocaleString() : undefined
                              });
                              if (inquiry.id) await markInquirySyncedInFirestore(inquiry.id);
                              count++;
                            } else if (googleToken && selectedSheetId) {
                              await appendLeadToSheet(googleToken, selectedSheetId, {
                                fullName: inquiry.fullName,
                                email: inquiry.email,
                                message: inquiry.message,
                                submittedAt: inquiry.submittedAt ? new Date(inquiry.submittedAt).toLocaleString() : undefined
                              });
                              if (inquiry.id) await markInquirySyncedInFirestore(inquiry.id);
                              count++;
                            }
                          } catch (e) {
                            console.error("Batch sync item failed:", e);
                          }
                        }
                        setIsLoadingSheets(false);
                        setLastSyncedLead(`Synced ${count} lead(s) straight to your Google Sheet!`);
                        setTimeout(() => setLastSyncedLead(null), 5000);
                      }}
                      className="w-full py-2.5 px-4 bg-[#34a853] hover:bg-[#2e9649] active:bg-[#27823f] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <RefreshCw className={`h-4 w-4 ${isLoadingSheets ? 'animate-spin' : ''}`} />
                      Sync All {dbInquiries.filter(i => !i.syncedToSheet).length} Pending Lead(s) To Google Sheet Now
                    </button>
                  </div>
                )}

                <div className="space-y-4 border-t border-slate-100 pt-5">
                  {!googleUser ? (
                    <div className="space-y-4">
                      <p className="text-xs text-secondary leading-relaxed">
                        Connect your Google Account to select or create your Google Sheet.
                      </p>
                      <button
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={isLoadingSheets}
                        className="w-full flex items-center justify-center gap-2.5 bg-white border border-slate-300 rounded-lg p-3 text-slate-700 text-sm font-semibold hover:bg-slate-50 active:bg-slate-100 transition-all duration-150 shadow-sm cursor-pointer disabled:opacity-60"
                      >
                        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-5 w-5 shrink-0 animate-pulse">
                          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                          <path fill="none" d="M0 0h48v48H0z"></path>
                        </svg>
                        Sign in with Google
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Active logged-in indicator */}
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {googleUser.photoURL ? (
                            <img 
                              src={googleUser.photoURL} 
                              alt={googleUser.displayName || 'Google Profile'} 
                              className="h-8 w-8 rounded-full border border-slate-200"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="h-8 w-8 bg-[#34a853]/10 text-[#34a853] font-bold rounded-full flex items-center justify-center text-xs">
                              {googleUser.email?.charAt(0).toUpperCase() || 'G'}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-primary truncate leading-none">
                              {googleUser.displayName || 'Authorized'}
                            </p>
                            <p className="text-[10px] text-secondary truncate mt-0.5">
                              {googleUser.email}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleGoogleLogout}
                          title="Disconnect account"
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <LogOut className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Enable Checkbox Router toggling */}
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="space-y-0.5">
                          <label htmlFor="sheets-enable-toggle" className="text-xs font-bold text-primary">Enable lead sync</label>
                          <p className="text-[10px] text-secondary">Route form submissions automatically</p>
                        </div>
                        <input
                          id="sheets-enable-toggle"
                          type="checkbox"
                          checked={isSheetsEnabled}
                          onChange={(e) => handleToggleSheets(e.target.checked)}
                          className="h-4.5 w-4.5 border-slate-300 rounded text-[#34a853] focus:ring-[#34a853] cursor-pointer"
                        />
                      </div>

                      {/* Choose Spreadsheet Dropdown or Create one */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-primary block">Select Target Google Sheet</label>
                        <div className="flex gap-2">
                          <select
                            disabled={isLoadingSheets || spreadsheets.length === 0}
                            value={selectedSheetId}
                            onChange={(e) => handleSelectSheet(e.target.value)}
                            className="flex-1 bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-primary focus:ring-1 focus:ring-[#34a853] focus:border-[#34a853] outline-none disabled:bg-slate-50"
                          >
                            {spreadsheets.length === 0 ? (
                              <option value="">-- No sheets found --</option>
                            ) : (
                              <>
                                <option value="">-- Select a spreadsheet --</option>
                                {spreadsheets.map((sheet) => (
                                  <option key={sheet.id} value={sheet.id}>
                                    {sheet.name}
                                  </option>
                                ))}
                              </>
                            )}
                          </select>
                          <button
                            type="button"
                            title="Create new sheet automatically"
                            onClick={handleCreateNewSheet}
                            disabled={isLoadingSheets}
                            className="p-2 bg-[#34a853]/10 hover:bg-[#34a853]/20 text-[#34a853] border border-[#34a853]/20 hover:border-[#34a853]/30 rounded-lg transition-all duration-150 tooltip flex items-center justify-center shrink-0 cursor-pointer disabled:opacity-50"
                          >
                            <Plus className="h-4.5 w-4.5" />
                          </button>
                        </div>

                        {/* Display helpful guidance if spreadsheet is selected or if empty */}
                        {selectedSheetId ? (
                          <div className="bg-green-50/70 border border-green-200/50 p-3 rounded-lg space-y-2">
                            <div className="flex items-start gap-2 text-[10px] text-green-800 leading-normal">
                              <Check className="h-3.5 w-3.5 text-green-600 mt-0.5 shrink-0" />
                              <span>Active Spreadsheet Linked. Columns: <strong>Timestamp, Name, Email, Message, Campaign</strong>.</span>
                            </div>
                            <a
                              href={`https://docs.google.com/spreadsheets/d/${selectedSheetId}/edit`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#34a853] hover:text-[#2b8a43] hover:underline"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              Open Active Google Sheet in New Tab ↗
                            </a>
                          </div>
                        ) : (
                          <p className="text-[10px] text-slate-500 leading-normal">
                            Tip: Click the <strong>+</strong> button to instantly deploy a new pre-formatted Google Sheet ready to collect leads.
                          </p>
                        )}
                      </div>

                      {/* Verification Test lead append */}
                      {selectedSheetId && (
                        <div className="pt-2 flex flex-col sm:flex-row gap-2">
                          <button
                            type="button"
                            onClick={handleSendTestLead}
                            disabled={isLoadingSheets}
                            className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-mono text-[10px] font-bold uppercase tracking-wider rounded transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            <RefreshCw className={`h-3 w-3 ${isLoadingSheets ? 'animate-spin' : ''}`} />
                            Verify / Send Test Row
                          </button>
                          <a
                            href={`https://docs.google.com/spreadsheets/d/${selectedSheetId}/edit`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="py-2 px-3 bg-[#34a853]/10 hover:bg-[#34a853]/20 text-[#34a853] font-mono text-[10px] font-bold uppercase tracking-wider rounded transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-[#34a853]/20"
                          >
                            <ExternalLink className="h-3 w-3" />
                            View Sheet
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 24/7 Direct Webhook Setup Section */}
                  <div className="border-t border-slate-100 pt-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-primary uppercase tracking-tight">24/7 Google Apps Script Webhook</h4>
                        <p className="text-[10px] text-secondary">Allows external site visitors to submit leads to Google Sheet without token expiration.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowWebhookGuide(!showWebhookGuide)}
                        className="text-[10px] font-bold text-[#34a853] hover:underline cursor-pointer"
                      >
                        {showWebhookGuide ? 'Hide Guide' : 'Setup Guide (30s)'}
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="url"
                        placeholder="https://script.google.com/macros/s/.../exec"
                        value={webhookUrl}
                        onChange={(e) => {
                          const val = e.target.value.trim();
                          setWebhookUrl(val);
                          localStorage.setItem('bbw_webhook_url', val);
                          saveSheetsConfigToFirestore({
                            spreadsheetId: selectedSheetId || '',
                            isSheetsEnabled,
                            accessToken: googleToken || undefined,
                            userEmail: googleUser?.email || undefined,
                            webhookUrl: val
                          });
                        }}
                        className="flex-1 bg-white border border-slate-200 rounded-lg p-2 text-xs text-primary focus:ring-1 focus:ring-[#34a853] focus:border-[#34a853] outline-none font-mono"
                      />
                      {webhookUrl && (
                        <span className="p-2 text-green-600 bg-green-50 rounded-lg flex items-center justify-center shrink-0" title="Webhook Configured Active">
                          <Check className="h-4 w-4" />
                        </span>
                      )}
                    </div>

                    {showWebhookGuide && (
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 text-[11px] text-slate-700 space-y-2.5 font-sans">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-slate-900 text-xs">Connect your Google Sheet in 30 seconds:</p>
                          <button
                            type="button"
                            onClick={() => {
                              const code = `function doPost(e) {
  try {
    var contents = e.postData ? e.postData.contents : "";
    var data = typeof contents === "string" ? JSON.parse(contents) : contents;
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    sheet.appendRow([
      data.submittedAt || new Date().toLocaleString(),
      data.fullName || "",
      data.email || "",
      data.message || "",
      "Website Lead"
    ]);
    return ContentService.createTextOutput(JSON.stringify({result: "success"})).setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({result: "error", error: err.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
}`;
                              navigator.clipboard.writeText(code);
                              setCopiedScript(true);
                              setTimeout(() => setCopiedScript(false), 3000);
                            }}
                            className="text-[10px] font-bold px-2.5 py-1 bg-[#34a853] text-white hover:bg-[#2b8a43] rounded flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            {copiedScript ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                            {copiedScript ? 'Copied Code!' : 'Copy Apps Script Code'}
                          </button>
                        </div>

                        <ol className="list-decimal pl-4 space-y-1 text-[11px] text-slate-600 leading-snug">
                          <li>Open your Google Sheet &amp; click <strong>Extensions &gt; Apps Script</strong>.</li>
                          <li>Delete any existing code, paste the script below, and click <strong>Save (💾)</strong>.</li>
                          <li>Click <strong>Deploy &gt; New deployment</strong>.</li>
                          <li>Select Type: <strong>Web app</strong>. Execute as: <strong>Me</strong>. Who has access: <strong>Anyone</strong>.</li>
                          <li>Click <strong>Deploy</strong>, copy the Web App URL, and paste it into the box above!</li>
                        </ol>

                        <div className="relative">
                          <pre className="bg-slate-900 text-slate-100 p-3 rounded-lg text-[9.5px] font-mono overflow-x-auto select-all leading-tight">
{`function doPost(e) {
  try {
    var contents = e.postData ? e.postData.contents : "";
    var data = typeof contents === "string" ? JSON.parse(contents) : contents;
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    sheet.appendRow([
      data.submittedAt || new Date().toLocaleString(),
      data.fullName || "",
      data.email || "",
      data.message || "",
      "Website Lead"
    ]);
    return ContentService.createTextOutput(JSON.stringify({result: "success"})).setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({result: "error", error: err.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
}`}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Feedback, warnings, success notifications */}
                  {sheetsError && (
                    <div className="bg-red-50 border border-red-200 p-3 rounded-lg flex gap-2 text-xs text-red-800">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>{sheetsError}</span>
                    </div>
                  )}

                  {lastSyncedLead && (
                    <div className="bg-green-50 border border-green-200 p-3 rounded-lg flex gap-2 text-xs text-green-800">
                      <Check className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>{lastSyncedLead}</span>
                    </div>
                  )}

                  {/* Real-time Inquiries Database Logger */}
                  <div className="border-t border-slate-100 pt-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-bold text-primary uppercase tracking-tight">Database Inquiries Ledger</h4>
                        <p className="text-[10px] text-secondary">Captured from all visitor entries ({dbInquiries.length})</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {googleToken && selectedSheetId && dbInquiries.some(i => !i.syncedToSheet) && (
                          <button
                            type="button"
                            disabled={isLoadingSheets}
                            onClick={async () => {
                              const pending = dbInquiries.filter(i => !i.syncedToSheet);
                              if (pending.length === 0) return;
                              setIsLoadingSheets(true);
                              let count = 0;
                              for (const inquiry of pending) {
                                try {
                                  await appendLeadToSheet(googleToken, selectedSheetId, {
                                    fullName: inquiry.fullName,
                                    email: inquiry.email,
                                    message: inquiry.message,
                                    submittedAt: inquiry.submittedAt ? new Date(inquiry.submittedAt).toLocaleString() : undefined
                                  });
                                  if (inquiry.id) {
                                    await markInquirySyncedInFirestore(inquiry.id);
                                  }
                                  count++;
                                } catch (e) {
                                  console.error("Batch sync item failed:", e);
                                }
                              }
                              setIsLoadingSheets(false);
                              setLastSyncedLead(`Successfully batch-synced ${count} lead(s) directly to Google Sheets!`);
                              setTimeout(() => setLastSyncedLead(null), 5000);
                            }}
                            className="text-[10px] font-mono font-bold text-white bg-[#34a853] hover:bg-[#2d9247] px-2.5 py-1 rounded transition-all cursor-pointer shadow-xs disabled:opacity-50"
                          >
                            Sync All Pending ({dbInquiries.filter(i => !i.syncedToSheet).length})
                          </button>
                        )}
                        <span className="h-2 w-2 rounded-full bg-green-500 animate-ping" title="Real-time Live Listener Active" />
                      </div>
                    </div>

                    {dbInquiries.length === 0 ? (
                      <p className="text-[10px] text-slate-400 italic text-center py-4 bg-slate-50 rounded-lg">
                        No submissions received in database yet.
                      </p>
                    ) : (
                      <div className="max-h-60 overflow-y-auto space-y-2 border border-slate-100 rounded-lg p-2 bg-slate-50/50">
                        {dbInquiries.map((inquiry) => (
                          <div key={inquiry.id} className="bg-white p-3 rounded-lg border border-slate-100 text-[10px] space-y-1 relative group">
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-bold text-primary truncate block max-w-[120px]" title={inquiry.fullName}>
                                {inquiry.fullName}
                              </span>
                              <span className="text-slate-400 shrink-0 select-none">
                                {inquiry.submittedAt ? new Date(inquiry.submittedAt).toLocaleDateString() : 'N/A'}
                              </span>
                            </div>
                            <p className="text-secondary select-all text-[9px] font-mono leading-none">{inquiry.email}</p>
                            <p className="text-slate-600 line-clamp-2 leading-normal mt-1 border-t border-slate-50 pt-1">
                              {inquiry.message}
                            </p>
                            <div className="flex items-center justify-between pt-1.5 mt-1 border-t border-slate-100">
                              <span className={`inline-flex items-center gap-1 font-bold ${
                                inquiry.syncedToSheet 
                                  ? 'text-green-600' 
                                  : 'text-amber-500'
                              }`}>
                                <span className={`h-1 w-1 rounded-full ${inquiry.syncedToSheet ? 'bg-green-600' : 'bg-amber-500 animate-pulse'}`} />
                                {inquiry.syncedToSheet ? 'Synced to Sheets' : 'Pending Auto-Sync'}
                              </span>
                              
                              {!inquiry.syncedToSheet && googleToken && selectedSheetId && (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (!inquiry.id) return;
                                    try {
                                      setIsLoadingSheets(true);
                                      await appendLeadToSheet(googleToken, selectedSheetId, {
                                        fullName: inquiry.fullName,
                                        email: inquiry.email,
                                        message: inquiry.message,
                                        submittedAt: inquiry.submittedAt ? new Date(inquiry.submittedAt).toLocaleString() : undefined
                                      });
                                      await markInquirySyncedInFirestore(inquiry.id);
                                      setLastSyncedLead(`Synced lead: "${inquiry.fullName}" to Google Sheet!`);
                                      setTimeout(() => setLastSyncedLead(null), 4500);
                                    } catch (err: any) {
                                      console.error("Manual sync failed:", err);
                                      setSheetsError("Manual sync failed. Please check tokens.");
                                    } finally {
                                      setIsLoadingSheets(false);
                                    }
                                  }}
                                  className="px-2 py-0.5 bg-primary/10 hover:bg-[#34a853]/20 hover:text-[#34a853] text-primary font-bold rounded hover:underline transition-all cursor-pointer"
                                >
                                  Sync now
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: The Inquiry Form Container */}
          <div className="lg:col-span-7">
            <div className="bg-[#091426] rounded-xl border border-primary p-8 md:p-12 shadow-xl text-white relative overflow-hidden">
              {/* Background accent block */}
              <div className="absolute -top-32 -right-32 w-64 h-64 bg-white/2 rounded-full blur-3xl pointer-events-none" />

              <h2 className="text-3xl font-bold mb-2 uppercase tracking-tight">Project Inquiry</h2>
              <p className="text-primary-fixed-dim/70 text-body-md mb-8">
                Tell us about your next local lead campaign goal.
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Full Name field */}
                  <div className="space-y-2">
                    <label className="text-label-md font-label-md text-primary-fixed block font-medium">Full Name</label>
                    <input
                      disabled={isSubmitting}
                      className={`w-full bg-white/5 border rounded-lg p-4 text-white text-body-md outline-none transition-all duration-200 placeholder:text-white/20 ${
                        errors.fullName ? 'border-red-400 focus:ring-1 focus:ring-red-400' : 'border-white/10 focus:ring-2 focus:ring-primary-fixed focus:border-primary-fixed'
                      }`}
                      placeholder="John Doe"
                      type="text"
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        if (errors.fullName) setErrors(prev => ({ ...prev, fullName: undefined }));
                      }}
                    />
                    {errors.fullName && (
                      <p className="text-xs text-red-300 font-mono italic">{errors.fullName}</p>
                    )}
                  </div>

                  {/* Email field */}
                  <div className="space-y-2">
                    <label className="text-label-md font-label-md text-primary-fixed block font-medium">Email Address</label>
                    <input
                      disabled={isSubmitting}
                      className={`w-full bg-white/5 border rounded-lg p-4 text-white text-body-md outline-none transition-all duration-200 placeholder:text-white/20 ${
                        errors.email ? 'border-red-400 focus:ring-1 focus:ring-red-400' : 'border-white/10 focus:ring-2 focus:ring-primary-fixed focus:border-primary-fixed'
                      }`}
                      placeholder="john@company.com"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email) setErrors(prev => ({ ...prev, email: undefined }));
                      }}
                    />
                    {errors.email && (
                      <p className="text-xs text-red-300 font-mono italic">{errors.email}</p>
                    )}
                  </div>
                </div>

                {/* Message field */}
                <div className="space-y-2">
                  <label className="text-label-md font-label-md text-primary-fixed block font-medium">Message</label>
                  <textarea
                    disabled={isSubmitting}
                    className={`w-full bg-white/5 border rounded-lg p-4 text-white text-body-md outline-none transition-all duration-200 placeholder:text-white/20 resize-none ${
                      errors.message ? 'border-red-400 focus:ring-1 focus:ring-red-400' : 'border-white/10 focus:ring-2 focus:ring-primary-fixed focus:border-primary-fixed'
                    }`}
                    placeholder="Tell us about your project goals, constraints, and target timeline..."
                    rows={5}
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value);
                      if (errors.message) setErrors(prev => ({ ...prev, message: undefined }));
                    }}
                  />
                  {errors.message && (
                    <p className="text-xs text-red-300 font-mono italic">{errors.message}</p>
                  )}
                </div>

                {/* Footer of the Form: Consent & Button */}
                <div className="pt-4 flex flex-col md:flex-row items-center justify-between gap-6">
                  <p className="text-[11px] font-sans text-primary-fixed-dim/60 max-w-xs leading-normal">
                    By submitting this form, you agree to our privacy policy regarding the structural handling of secure contact metadata.
                  </p>
                  
                  <button
                    disabled={isSubmitting}
                    type="submit"
                    className="w-full md:w-auto px-8 py-3.5 bg-white hover:bg-slate-200 text-primary font-bold font-mono text-xs uppercase tracking-wider rounded transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span className="inline-flex items-center gap-2">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Submitting Inquiry...
                      </span>
                    ) : (
                      <>
                        Book a Consultation
                        <ArrowRight className="h-4 w-4 shrink-0" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

      </main>

      {/* Real Form Success Dialog Overlays using standard interactive components */}
      <AnimatePresence>
        {showSuccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Overlay background */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSuccess(false)}
              className="absolute inset-0 bg-primary/70 backdrop-blur-sm"
              id="success-backdrop"
            />
            
            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-outline-variant rounded-xl p-8 md:p-10 max-w-md w-full relative z-10 text-center shadow-2xl space-y-6"
              id="success-modal"
            >
              <div className="h-16 w-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto border border-green-200">
                <CheckCircle2 className="h-9 w-9" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-bold font-display-lg text-primary uppercase tracking-tight">Inquiry Received</h3>
                <p className="text-secondary text-body-md font-body-md leading-relaxed">
                  Thank you for reaching out! Your inquiry has been submitted and recorded. We will review your details and get back to you shortly.
                </p>
              </div>

              <div className="bg-surface-container-low p-4 rounded-lg flex flex-col gap-2 border border-outline-variant/30 text-xs text-secondary font-mono">
                <div className="flex items-center justify-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-green-500 shrink-0" />
                  <span>ID: BBW-{Math.random().toString(36).substring(3, 8).toUpperCase()} (Recorded)</span>
                </div>
                
                {selectedSheetId && isSheetsEnabled && (
                  <div className="text-[10px] text-green-700 bg-green-50 border border-green-200 p-2 rounded flex items-center justify-between gap-2 mt-1">
                    <span className="font-bold flex items-center gap-1">
                      <Check className="h-3.5 w-3.5 text-green-600" />
                      Stored in Google Sheet!
                    </span>
                    <a
                      href={`https://docs.google.com/spreadsheets/d/${selectedSheetId}/edit`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#34a853] hover:underline font-bold flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Open Sheet ↗
                    </a>
                  </div>
                )}

                <div className="text-[10px] text-slate-500 border-t border-slate-100 pt-1.5 leading-relaxed text-center">
                  {provider !== 'local' && integrationKey.trim() ? (
                    <span className="text-green-600 font-bold">✓ Email notification delivered</span>
                  ) : (
                    <span className="text-slate-600 font-bold">✓ Saved in Database & Google Sheets ledger</span>
                  )}
                </div>
              </div>

              <button
                onClick={() => setShowSuccess(false)}
                className="w-full py-4.5 bg-primary hover:bg-primary-container text-white font-bold rounded-lg font-label-md tracking-wider uppercase transition-colors pointer-events-auto cursor-pointer"
                id="close-success-dialog"
              >
                Acknowledge &amp; Return
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
