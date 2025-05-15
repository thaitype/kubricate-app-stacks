export interface IPrivateCertStack {
  name: string;
  namespace?: string;
  dnsNames: string[];
  commonName: string;
  duration: string;
  secretCertName: string;
  pfxCertName: string;
  backoffLimit: number;
  key2pfxCronCode: string;
}
