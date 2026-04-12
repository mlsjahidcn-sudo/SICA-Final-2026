/**
 * Step 3: Details - Intake, Priority, Statements
 */

"use client";

import { useFormContext } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { IconCalendar, IconFileText, IconNotes } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import type { ApplicationFormData } from "./types";

const PRIORITY_OPTIONS = [
  { value: 0, label: "Normal", color: "bg-gray-100 text-gray-800 hover:bg-gray-200" },
  { value: 1, label: "Low", color: "bg-blue-100 text-blue-800 hover:bg-blue-200" },
  { value: 2, label: "High", color: "bg-orange-100 text-orange-800 hover:bg-orange-200" },
  { value: 3, label: "Urgent", color: "bg-red-100 text-red-800 hover:bg-red-200" },
];

export function DetailsStep() {
  const { control, watch } = useFormContext<ApplicationFormData>();

  const personalStatement = watch("personal_statement");
  const studyPlan = watch("study_plan");
  const notes = watch("notes");

  return (
    <div className="space-y-6">
      {/* Section 1: Timeline */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <IconCalendar className="h-5 w-5 text-primary" />
          <h3 className="text-base font-semibold">Timeline</h3>
        </div>
        
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={control}
            name="intake"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Intake Period</FormLabel>
                <FormDescription>
                  Expected enrollment semester
                </FormDescription>
                <FormControl>
                  <Input
                    placeholder="e.g., Fall 2025"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority Level</FormLabel>
                <FormDescription>
                  Application priority for review
                </FormDescription>
                <div className="flex gap-2 flex-wrap">
                  {PRIORITY_OPTIONS.map((option) => (
                    <Button
                      key={option.value}
                      type="button"
                      variant={field.value === option.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => field.onChange(option.value)}
                      className={cn(
                        "transition-all",
                        field.value === option.value && "ring-2 ring-primary ring-offset-2"
                      )}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      <Separator />

      {/* Section 2: Content */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <IconFileText className="h-5 w-5 text-primary" />
          <h3 className="text-base font-semibold">Application Content</h3>
        </div>

        <FormField
          control={control}
          name="personal_statement"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Personal Statement</FormLabel>
              <FormDescription>
                Student's personal background, goals, and motivations
              </FormDescription>
              <FormControl>
                <Textarea
                  placeholder="Student's personal statement..."
                  {...field}
                  value={field.value || ""}
                  rows={5}
                  className="resize-none"
                />
              </FormControl>
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>Describe background and aspirations</span>
                <span className={cn(
                  (personalStatement?.length || 0) > 4500 && "text-orange-600"
                )}>
                  {(personalStatement?.length || 0)}/5000
                </span>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="study_plan"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Study Plan</FormLabel>
              <FormDescription>
                Proposed course of study and research objectives
              </FormDescription>
              <FormControl>
                <Textarea
                  placeholder="Student's study plan..."
                  {...field}
                  value={field.value || ""}
                  rows={5}
                  className="resize-none"
                />
              </FormControl>
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>Outline academic goals and timeline</span>
                <span className={cn(
                  (studyPlan?.length || 0) > 4500 && "text-orange-600"
                )}>
                  {(studyPlan?.length || 0)}/5000
                </span>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <Separator />

      {/* Section 3: Admin */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <IconNotes className="h-5 w-5 text-primary" />
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold">Admin Notes</h3>
            <Badge variant="outline" className="text-xs">
              Internal Use Only
            </Badge>
          </div>
        </div>

        <FormField
          control={control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormDescription>
                Internal notes not visible to the student
              </FormDescription>
              <FormControl>
                <Textarea
                  placeholder="Internal notes..."
                  {...field}
                  value={field.value || ""}
                  rows={3}
                  className="resize-none"
                />
              </FormControl>
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>For internal review purposes</span>
                <span className={cn(
                  (notes?.length || 0) > 1800 && "text-orange-600"
                )}>
                  {(notes?.length || 0)}/2000
                </span>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}

// Helper component for FormControl
function FormControl({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
