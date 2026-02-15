
"use client";

import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, doc, updateDoc } from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Eye, 
  HelpCircle,
  BadgeCent,
  Calendar,
  User,
  FileText,
  Target
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function AdminPendingRequests() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [selectedIstifham, setSelectedIstifham] = useState<any>(null);

  const istifhamsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, "istifhams"), 
      where("status", "==", "pending_approval")
    );
  }, [firestore]);

  const { data: istifhams, isLoading } = useCollection(istifhamsQuery);

  const handleApprove = async (id: string) => {
    if (!firestore) return;
    try {
      const reqRef = doc(firestore, "istifhams", id);
      await updateDoc(reqRef, { 
       <ctrl63>