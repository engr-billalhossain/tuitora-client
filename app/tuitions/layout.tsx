import { Toaster } from "@/components/ui/sonner";

export default function TuitionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Toaster />
      {children}
    </>
  );
}
