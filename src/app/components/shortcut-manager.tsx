"use client";

import type React from "react";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface Shortcut {
  name: string;
  content: string;
}

export function ShortcutManager() {
  const [shortcutName, setShortcutName] = useState("");
  const [shortcutContent, setShortcutContent] = useState("");
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
  const [testInput, setTestInput] = useState("");
  const [testOutput, setTestOutput] = useState("");
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Function to convert Markdown-like bold (**text**) to HTML <strong>
  const renderContent = useCallback((markdown: string) => {
    // Replace **text** with <strong>text</strong>
    // This regex handles cases where ** might be at the start/end of a line or word
    const html = markdown.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    return html;
  }, []);

  // Load shortcuts from localStorage on component mount
  useEffect(() => {
    try {
      const savedShortcuts = localStorage.getItem("shortcuts");
      if (savedShortcuts) {
        setShortcuts(JSON.parse(savedShortcuts));
      }
    } catch (error) {
      console.error("Failed to load shortcuts from localStorage:", error);
      setMessage({ type: "error", text: "Failed to load saved shortcuts." });
    }
  }, []);

  // Save shortcuts to localStorage whenever the 'shortcuts' state changes
  useEffect(() => {
    try {
      localStorage.setItem("shortcuts", JSON.stringify(shortcuts));
    } catch (error) {
      console.error("Failed to save shortcuts to localStorage:", error);
      setMessage({ type: "error", text: "Failed to save shortcuts." });
    }
  }, [shortcuts]);

  const handleSaveShortcut = useCallback(() => {
    if (!shortcutName.trim() || !shortcutContent.trim()) {
      setMessage({
        type: "error",
        text: "Both shortcut name and content are required.",
      });
      return;
    }

    // Check if shortcut name already exists
    const existingShortcutIndex = shortcuts.findIndex(
      (s) => s.name === shortcutName.trim()
    );

    if (existingShortcutIndex !== -1) {
      // Update existing shortcut
      const updatedShortcuts = [...shortcuts];
      updatedShortcuts[existingShortcutIndex] = {
        name: shortcutName.trim(),
        content: shortcutContent,
      };
      setShortcuts(updatedShortcuts);
      setMessage({
        type: "success",
        text: `Shortcut '${shortcutName.trim()}' updated!`,
      });
    } else {
      // Add new shortcut
      setShortcuts((prev) => [
        ...prev,
        { name: shortcutName.trim(), content: shortcutContent },
      ]);
      setMessage({
        type: "success",
        text: `Shortcut '${shortcutName.trim()}' saved correctly!`,
      });
    }

    // Clear input fields
    setShortcutName("");
    setShortcutContent("");
    setTimeout(() => setMessage(null), 2000); // Clear message after 3 seconds
  }, [shortcutName, shortcutContent, shortcuts]);

  const handleTestInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value;
      setTestInput(input);

      const foundShortcut = shortcuts.find((s) => s.name === input.trim());
      if (foundShortcut) {
        setTestOutput(foundShortcut.content);
      } else {
        setTestOutput("Shortcut does not exist yet");
      }
    },
    [shortcuts]
  );

  // Clearing all the shortcuts at once from the LocalStorage

  const handleClearAllShortcuts = useCallback(() => {
    if (confirm("Are you sure you want to delete all saved shortcuts?")) {
      setShortcuts([]);
      setTestOutput("");
      setMessage({ type: "success", text: "All shortcuts cleared." });
      setTimeout(() => setMessage(null), 3000);
    }
  }, []);

  // Handle Ctrl+B / Cmd+B for bold formatting
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "b") {
        e.preventDefault(); // Prevent browser default bold action

        const textarea = contentTextareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = shortcutContent.substring(start, end);

        let newContent: string;
        let newCursorPos: number;

        // Check if selected text is already bold
        if (selectedText.startsWith("**") && selectedText.endsWith("**")) {
          // Remove bold
          newContent =
            shortcutContent.substring(0, start) +
            selectedText.substring(2, selectedText.length - 2) +
            shortcutContent.substring(end);
          newCursorPos = start + selectedText.length - 4; // Adjust cursor for removed **
        } else {
          // Add bold
          newContent =
            shortcutContent.substring(0, start) +
            "**" +
            selectedText +
            "**" +
            shortcutContent.substring(end);
          newCursorPos = start + selectedText.length + 2; // Adjust cursor for added **
        }

        setShortcutContent(newContent);

        // Restore selection/cursor position after state update
        // This needs to be done after the state has updated, so often requires a setTimeout
        // or using a ref callback if not using a controlled component.
        // For simplicity, we'll use a small timeout here.
        setTimeout(() => {
          if (textarea) {
            textarea.selectionStart = newCursorPos;
            textarea.selectionEnd = newCursorPos;
          }
        }, 0);
      }
    },
    [shortcutContent]
  );

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-8">
      <Card className="w-full max-w-3xl border-2 border-white rounded-3xl p-8 space-y-8 bg-[#e9ecef] text-gray-900">
        <CardHeader className="pb-4">
          <CardTitle className="text-3xl font-bold text-center text-gray-900">
            Shortcut Text Manager
          </CardTitle>
          <p className="text-center text-gray-600 text-sm">
            Create and save your custom commands pals
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {message && (
            <Alert
              className={`border ${
                message.type === "success"
                  ? "border-green-500 text-green-700"
                  : "border-red-500 text-red-700"
              } bg-white`}
            >
              <Info className="h-4 w-4" />
              <AlertTitle>
                {message.type === "success" ? "Success" : "Error"}
              </AlertTitle>
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          {/* Input 1: Shortcut Name */}
          <div className="space-y-2">
            <Label htmlFor="shortcutName" className="text-gray-800">
              Shortcut Trigger (Example: /admin, .driver, #Logs, etc)
            </Label>
            <Input
              id="shortcutName"
              placeholder="Enter shortcut name (e.g., .greet)"
              value={shortcutName}
              onChange={(e) => setShortcutName(e.target.value)}
              className="h-16 border-2 border-white rounded-xl bg-white text-gray-900 placeholder:text-gray-500 focus:ring-offset-0 focus:ring-0"
            />
          </div>

          {/* Input 2: Shortcut Content */}
          <div className="space-y-2">
            <Label htmlFor="shortcutContent" className="text-gray-800">
              Shortcut Contain
            </Label>
            <Textarea
              id="shortcutContent"
              ref={contentTextareaRef}
              placeholder="Write the content the shortcut should contain"
              value={shortcutContent}
              onChange={(e) => setShortcutContent(e.target.value)}
              onKeyDown={handleKeyDown}
              className="h-24 border-2 border-white rounded-xl bg-white text-gray-900 placeholder:text-gray-300 focus:ring-offset-0 focus:ring-0 resize-y"
            />
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSaveShortcut}
            className="w-full h-12 bg-gray-800 text-white hover:bg-gray-900 rounded-xl text-lg font-semibold transition-colors"
          >
            Save It
          </Button>

          {/* Test Output Section */}
          <div className="space-y-2 pt-4">
            <Label htmlFor="testInput" className="text-gray-800">
              Test the shortcut then, copy and paste the content ^^
            </Label>
            <Input
              id="testInput"
              placeholder="Type a saved shortcut"
              value={testInput}
              onChange={handleTestInputChange}
              className="h-16 border-2 border-white rounded-xl bg-white text-gray-900 placeholder:text-gray-500 focus:ring-offset-0 focus:ring-0"
            />
            <pre className="h-24 border-2 border-white rounded-xl bg-white text-gray-900 p-4 whitespace-pre-wrap overflow-auto">
              {testOutput || "Output will appear here..."}
            </pre>
          </div>

          {shortcuts.length > 0 && (
            <div className="text-center pt-4">
              <Button
                onClick={handleClearAllShortcuts}
                variant="destructive"
                className="bg-red-700 hover:bg-red-800 text-white rounded-lg"
              >
                Clear all shortcuts saved
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
