import { Button } from "@/components/ui/button";
import { ClerkProvider } from "@clerk/nextjs";
import Image from "next/image";

export default function Home() {
  return (
    <ClerkProvider>
     <div>
      <h2>Hi this is akshat</h2>
      <Button>Akshat</Button>
     </div>
     </ClerkProvider>

  );
}
