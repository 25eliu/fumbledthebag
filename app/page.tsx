import BagApp from "@/components/BagApp";

export default function Home() {
  return <BagApp initial={{ ticker: "NVDA", amount: 10000 }} />;
}
