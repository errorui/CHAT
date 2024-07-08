import Image from "next/image";
import ChatForm from './compontes/Form';
import { Card, CardHeader, CardTitle, } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-300 p-5">
      <Card className="mb-5"> 
      <CardHeader className="text-center uppercase text-3xl">
        <CardTitle>talk-tip</CardTitle>
       
      </CardHeader>
      </Card>
     <ChatForm></ChatForm>
    </div>
  );
}
