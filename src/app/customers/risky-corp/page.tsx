import { riskyCorpData } from "../../../data/customers";
import CustomerRenewalLayout from "../../../components/customers/CustomerRenewalLayout";

export default function RiskyCorpPage() {
  return <CustomerRenewalLayout {...riskyCorpData} />;
} 