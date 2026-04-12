/**
 * Step 2: Program Selection
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useFormContext } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
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
import { IconSearch, IconSchool, IconCheck, IconMapPin } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import type { Program, ApplicationFormData } from "../types";

interface ProgramSelectionStepProps {
  programs: Program[];
  onSearch: (search: string) => void;
  isFetching: boolean;
}

export function ProgramSelectionStep({
  programs,
  onSearch,
  isFetching,
}: ProgramSelectionStepProps) {
  const { control, watch, setValue } = useFormContext<ApplicationFormData>();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const selectedProgramId = watch("program_id");
  const customProgramNote = watch("requested_university_program_note");
  const selectedProgram = programs.find((p) => p.id === selectedProgramId);

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
        name="program_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base">Select Program (Optional)</FormLabel>
            <FormDescription>
              Search from our program database
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
                    {selectedProgram ? (
                      <div className="flex items-center gap-2">
                        <IconSchool className="h-4 w-4" />
                        <span>{selectedProgram.name}</span>
                        <span className="text-muted-foreground text-sm">
                          ({selectedProgram.universities?.name_en})
                        </span>
                      </div>
                    ) : (
                      <span>Search programs...</span>
                    )}
                    <IconSearch className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[600px] p-0" align="start">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Search by program or university name..."
                    value={searchQuery}
                    onValueChange={setSearchQuery}
                  />
                  <CommandList>
                    <CommandEmpty>
                      {isFetching ? "Loading..." : "No programs found."}
                    </CommandEmpty>
                    <CommandGroup>
                      {programs.map((program) => (
                        <CommandItem
                          key={program.id}
                          value={program.id}
                          onSelect={() => {
                            field.onChange(program.id);
                            setValue("requested_university_program_note", "");
                            setPopoverOpen(false);
                          }}
                          className="py-3"
                        >
                          <div className="flex items-center gap-3 w-full">
                            {/* University Logo */}
                            {program.universities?.logo_url ? (
                              <img
                                src={program.universities.logo_url}
                                alt={program.universities.name_en}
                                className="w-10 h-10 rounded-lg object-cover border border-border/50"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                                <IconSchool className="h-5 w-5 text-primary" />
                              </div>
                            )}
                            
                            {/* Program Info */}
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm">{program.name}</div>
                              <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                                <span className="truncate">{program.universities?.name_en}</span>
                                {program.degree_level && (
                                  <>
                                    <span className="text-border">•</span>
                                    <span>{program.degree_level}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            
                            {/* Check Icon */}
                            {selectedProgramId === program.id && (
                              <IconCheck className="h-4 w-4 text-primary shrink-0" />
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

      {selectedProgram && (
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent shadow-sm">
          <CardContent className="pt-4">
            <div className="flex items-start gap-4">
              {/* University Logo */}
              {selectedProgram.universities?.logo_url ? (
                <img
                  src={selectedProgram.universities.logo_url}
                  alt={selectedProgram.universities.name_en}
                  className="w-14 h-14 rounded-xl object-cover border-2 border-primary/20 shadow-sm"
                />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border-2 border-primary/20">
                  <IconSchool className="h-7 w-7 text-primary" />
                </div>
              )}
              
              {/* Program Details */}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-base">{selectedProgram.name}</div>
                <div className="text-sm text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
                  <span>{selectedProgram.universities?.name_en}</span>
                  {selectedProgram.degree_level && (
                    <>
                      <span className="text-border">•</span>
                      <Badge variant="secondary" className="text-xs">
                        {selectedProgram.degree_level}
                      </Badge>
                    </>
                  )}
                </div>
                {selectedProgram.universities?.city && (
                  <div className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                    <IconMapPin className="h-3.5 w-3.5" />
                    <span>
                      {selectedProgram.universities.city}
                      {selectedProgram.universities.province && `, ${selectedProgram.universities.province}`}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Clear Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setValue("program_id", "")}
                className="hover:bg-destructive/10 hover:text-destructive"
              >
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="relative">
        <div className="absolute inset-0 flex items">
          <Separator />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or enter custom request
          </span>
        </div>
      </div>

      <FormField
        control={control}
        name="requested_university_program_note"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Custom Program Request</FormLabel>
            <FormDescription>
              If the program is not in our database, describe the desired program and university
            </FormDescription>
            <FormControl>
              <Textarea
                placeholder="E.g., PhD in Computer Science at Tsinghua University"
                {...field}
                value={field.value || ""}
                rows={3}
                onChange={(e) => {
                  field.onChange(e);
                  if (e.target.value) {
                    setValue("program_id", "");
                  }
                }}
                className="resize-none"
              />
            </FormControl>
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>Provide program and university details</span>
              <span>{(field.value || "").length}/500</span>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
