export interface ProjectInquiry {
  id: string;
  fullName: string;
  email: string;
  message: string;
  submittedAt: string;
  status: 'pending' | 'reviewed' | 'responded';
}

export interface SearchAd {
  id: string;
  query: string;
  companyName: string;
  headline1: string;
  headline2: string;
  headline3?: string;
  displayUrl: string;
  description1: string;
  description2?: string;
  sitelinks: string[];
  location: string;
  industry: string;
  realCompanyUrl: string;
}

export interface EthosCard {
  id: string;
  title: string;
  description: string;
  iconName: string;
}
