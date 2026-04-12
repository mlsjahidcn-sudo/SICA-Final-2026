/**
 * Step 1: Student Selection
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useFormContext } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { IconSearch, IconUser, IconCheck } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import type { Student, ApplicationFormData } from "../types";

interface StudentSelectionStepProps {
  students: Student[];
  onSearch: (search: string) => void;
  isFetching: boolean;
}

export function StudentSelectionStep({
  students,
  onSearch,
  isFetching,
}: StudentSelectionStepProps) {
  const { control, setValue, watch } = useFormContext<ApplicationFormData>();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const selectedStudentId = watch("student_id");
  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, onSearch]);

  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name="student_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base">Select Student *</FormLabel>
            <FormDescription>
              Search by name, email, or nationality
            </FormDescription>
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className={cn(
                    "w-full justify-between",
                    !field.value && "text-muted-foreground"
                  )}
                >
                    {selectedStudent ? (
                      <div className="flex items-center gap-2">
                        <IconUser className="h-4 w-4" />
                        <span>{selectedStudent.users.full_name}</span>
                        <span className="text-muted-foreground text-sm">
                          ({selectedStudent.users.email})
                        </span>
                      </div>
                    ) : (
                      <span>Search and select a student...</span>
                    )}
                    <IconSearch className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[500px] p-0" align="start">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onValueChange={setSearchQuery}
                  />
                  <CommandList>
                    <CommandEmpty>
                      {isFetching ? "Loading..." : "No students found."}
                    </CommandEmpty>
                    <CommandGroup>
                      {students.map((student) => (
                        <CommandItem
                          key={student.id}
                          value={student.id}
                          onSelect={() => {
                            field.onChange(student.id);
                            setPopoverOpen(false);
                          }}
                        >
                          <div className="flex items-center gap-2 w-full">
                            <IconUser className="h-4 w-4" />
                            <div className="flex-1">
                              <div className="font-medium">
                                {student.users.full_name}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {student.users.email}
                                {student.nationality && ` • ${student.nationality}`}
                              </div>
                            </div>
                            {selectedStudentId === student.id && (
                              <IconCheck className="h-4 w-4 text-primary" />
                            )}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        )}
      />

      {selectedStudent && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <IconUser className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="font-medium">
                  {selectedStudent.users.full_name}
                </div>
                <div className="text-sm text-muted-foreground">
                  {selectedStudent.users.email}
                </div>
              </div>
              {selectedStudent.nationality && (
                <Badge variant="outline">{selectedStudent.nationality}</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
