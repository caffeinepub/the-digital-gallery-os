import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Plus, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAddSupplierNote } from "../hooks/useQueries";
import {
  type LocalNote,
  addLocalNote,
  deleteLocalNote,
  getLocalNotes,
} from "../utils/localStorage";

export default function SupplierNotes() {
  const [notes, setNotes] = useState<LocalNote[]>([]);
  const [noteText, setNoteText] = useState("");
  const addNote = useAddSupplierNote();

  useEffect(() => {
    setNotes(getLocalNotes());
  }, []);

  const handleSave = async () => {
    if (!noteText.trim()) {
      toast.error("Please enter a note");
      return;
    }
    const saved = addLocalNote(noteText.trim());
    setNotes((prev) => [saved, ...prev]);
    setNoteText("");
    toast.success("Note saved!");
    addNote.mutate(noteText.trim());
  };

  const handleDelete = (id: string) => {
    deleteLocalNote(id);
    setNotes((prev) => prev.filter((n) => n.id !== id));
    toast.success("Note deleted");
  };

  const formatDate = (timestamp: number) =>
    new Date(timestamp).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-5"
      data-ocid="notes.section"
    >
      <div>
        <h2 className="font-serif text-2xl font-bold text-foreground">
          Supplier Notes
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Log supplier payments and material notes
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-card p-5 space-y-3">
        <h3 className="font-serif text-base font-semibold text-foreground">
          Add a Note
        </h3>
        <Textarea
          placeholder="e.g. Paid ₹2,000 to wood supplier for 10 moulding strips — 20 March 2026"
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          rows={3}
          className="bg-background border-border resize-none focus:ring-ring"
          data-ocid="notes.textarea"
        />
        <Button
          onClick={handleSave}
          disabled={addNote.isPending}
          className="bg-[#D4AF37] hover:bg-[#b8962e] text-white font-medium rounded-lg h-10 px-5"
          data-ocid="notes.submit_button"
        >
          <Plus className="mr-2 h-4 w-4" />
          Save Note
        </Button>
      </div>

      <div className="space-y-3">
        {notes.length === 0 ? (
          <div
            className="bg-card border border-border rounded-xl shadow-card p-10 text-center"
            data-ocid="notes.empty_state"
          >
            <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-40" />
            <p className="text-muted-foreground text-sm">No notes yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Add supplier payment records above
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {notes.map((note, i) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="bg-card border border-border rounded-xl shadow-card p-4"
                data-ocid={`notes.item.${i + 1}`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#F3E6B8]/60 flex items-center justify-center shrink-0 mt-0.5">
                    <FileText className="h-4 w-4 text-[#8A6B12]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                      {note.text}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatDate(note.timestamp)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(note.id)}
                    className="w-7 h-7 rounded-lg hover:bg-red-50 hover:text-red-500 text-muted-foreground flex items-center justify-center transition-colors shrink-0"
                    data-ocid="notes.delete_button"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
}
