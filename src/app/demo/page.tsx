import { acmeCorpData } from "../../data/customers";
import CustomerRenewalLayout from "../../components/customers/CustomerRenewalLayout";

export default function AcmeCorpPage() {
  return <CustomerRenewalLayout {...acmeCorpData} />;
} 