/**
 * Step 4: Review and Confirm
 */

"use client";

import { useFormContext } from "react-hook-form";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  IconUser,
  IconSchool,
  IconCalendar,
  IconFileText,
  IconNotes,
  IconEdit,
} from "@tabler/icons-react";
import type { ApplicationFormData, Student, Program } from "../types";

interface ReviewStepProps {
  students: Student[];
  programs: Program[];
  onEditStep: (step: number) => void;
}

const PRIORITY_LABELS = {
  0: { label: "Normal", color: "bg-gray-100 text-gray-800" },
  1: { label: "Low", color: "bg-blue-100 text-blue-800" },
  2: { label: "High", color: "bg-orange-100 text-orange-800" },
  3: { label: "Urgent", color: "bg-red-100 text-red-800" },
};

export function ReviewStep({ students, programs, onEditStep }: ReviewStepProps) {
  const { watch } = useFormContext<ApplicationFormData>();

  const formData = watch();
  const selectedStudent = students.find((s) => s.id === formData.student_id);
  const selectedProgram = programs.find((p) => p.id === formData.program_id);
  const priorityConfig = PRIORITY_LABELS[formData.priority as keyof typeof PRIORITY_LABELS];

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-4 space-y-4">
          {/* Student Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <IconUser className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">
                  Student
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEditStep(0)}
                className="h-7 px-2"
              >
                <IconEdit className="h-3 w-3 mr-1" />
                Edit
              </Button>
            </div>
            {selectedStudent && (
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {selectedStudent.users.full_name}
                </span>
                <span className="text-muted-foreground">
                  ({selectedStudent.users.email})
                </span>
                {selectedStudent.nationality && (
                  <Badge variant="outline">{selectedStudent.nationality}</Badge>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Program Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <IconSchool className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">
                  Program
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEditStep(1)}
                className="h-7 px-2"
              >
                <IconEdit className="h-3 w-3 mr-1" />
                Edit
              </Button>
            </div>
            {selectedProgram ? (
              <div className="flex items-center gap-2">
                <span className="font-medium">{selectedProgram.name}</span>
                <span className="text-muted-foreground">
                  ({selectedProgram.universities?.name_en})
                </span>
              </div>
            ) : formData.requested_university_program_note ? (
              <div className="text-muted-foreground italic">
                "{formData.requested_university_program_note}"
              </div>
            ) : (
              <div className="text-muted-foreground">No program selected</div>
            )}
          </div>

          <Separator />

          {/* Timeline Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <IconCalendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">
                  Timeline
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEditStep(2)}
                className="h-7 px-2"
              >
                <IconEdit className="h-3 w-3 mr-1" />
                Edit
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Intake</div>
                <div className="font-medium">
                  {formData.intake || "Not specified"}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Priority</div>
                <Badge className={priorityConfig.color}>
                  {priorityConfig.label}
                </Badge>
              </div>
            </div>
          </div>

          {/* Content Section */}
          {(formData.personal_statement || formData.study_plan) && (
            <>
              <Separator />
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <IconFileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">
                      Content
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditStep(2)}
                    className="h-7 px-2"
                  >
                    <IconEdit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                </div>
                <div className="space-y-2">
                  {formData.personal_statement && (
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">
                        Personal Statement
                      </div>
                      <div className="text-sm line-clamp-2">
                        {formData.personal_statement}
                      </div>
                    </div>
                  )}
                  {formData.study_plan && (
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">
                        Study Plan
                      </div>
                      <div className="text-sm line-clamp-2">
                        {formData.study_plan}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Admin Notes Section */}
          {formData.notes && (
            <>
              <Separator />
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <IconNotes className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">
                    Admin Notes
                  </span>
                  <Badge variant="outline" className="text-xs">
                    Internal
                  </Badge>
                </div>
                <div className="text-sm line-clamp-2">{formData.notes}</div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground text-center">
        The application will be created with status{" "}
        <Badge variant="outline">draft</Badge>
      </p>
    </div>
  );
}
