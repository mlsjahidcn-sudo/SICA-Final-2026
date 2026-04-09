import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

import {
    FileText,
    Users,
    GraduationCap,
    CheckCircle2,
    ArrowRight,
    Sparkles,
    BookOpen,
    Target,
    Clock,
    Shield,
    Globe,
    Zap,
} from "lucide-react";

export default function AssessmentLandingPage() {
    const benefits = [{
        icon: GraduationCap,
        title: "Personalized Recommendations",
        description: "Get matched with universities and programs that fit your academic profile and career goals."
    }, {
        icon: Sparkles,
        title: "AI-Powered Analysis",
        description: "Our advanced AI analyzes your profile to generate a comprehensive evaluation report."
    }, {
        icon: BookOpen,
        title: "Scholarship Guidance",
        description: "Discover scholarship opportunities you're eligible for and learn how to apply."
    }, {
        icon: Target,
        title: "Clear Roadmap",
        description: "Receive a step-by-step action plan with timelines for your application journey."
    }];

    const steps = [{
        step: "1",
        title: "Submit Your Information",
        description: "Fill out our comprehensive form with your academic background and preferences."
    }, {
        step: "2",
        title: "AI Analysis",
        description: "Our system analyzes your profile and generates a personalized report within 24-48 hours."
    }, {
        step: "3",
        title: "Receive Your Report",
        description: "Get detailed recommendations, scholarship opportunities, and application guidance."
    }, {
        step: "4",
        title: "Start Your Journey",
        description: "Use our insights to apply to your dream universities with confidence."
    }];

    const features = [
        "100% Free Assessment",
        "Expert AI Analysis",
        "Personalized University Matches",
        "Scholarship Eligibility Check",
        "Application Timeline Guidance",
        "Cost Estimates & Budget Planning"
    ];

    const testimonials = [{
        name: "Ahmad Hassan",
        country: "Pakistan",
        quote: "The assessment report helped me identify 5 universities I hadn't considered. I'm now studying at Tsinghua!",
        program: "Computer Science, Tsinghua University"
    }, {
        name: "Maria Santos",
        country: "Philippines",
        quote: "The scholarship guidance was invaluable. I received a full Chinese Government Scholarship thanks to their recommendations.",
        program: "International Business, Fudan University"
    }, {
        name: "John Smith",
        country: "Nigeria",
        quote: "Clear, professional, and incredibly helpful. The timeline they provided made my application process stress-free.",
        program: "Medicine, Zhejiang University"
    }];

    return (
        <div className="min-h-screen bg-background">
            {}
            <section className="border-b">
                <div className="container mx-auto px-4 py-12 sm:py-16 lg:py-20">
                    <div className="mx-auto max-w-3xl text-center">
                        <Badge variant="secondary" className="mb-4">
                            <Sparkles className="mr-1.5 h-3 w-3" />Free AI-Powered Assessment
                                        </Badge>
                        <h1
                            className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl"
                            style={{
                                fontSize: "45px"
                            }}>Discover Your Path to Study in China
                                        </h1>
                        <p className="mb-8 text-muted-foreground sm:text-lg">Get a personalized evaluation report with university recommendations, scholarship opportunities,
                                          and a clear roadmap for your academic journey.
                                        </p>
                        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                            <Button size="lg" className="w-full sm:w-auto" asChild>
                                <Link href="/assessment/apply">Get Free Assessment
                                                      <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                            <Button variant="outline" size="lg" className="w-full sm:w-auto" asChild>
                                <Link href="/assessment/track">Track Application</Link>
                            </Button>
                        </div>
                        <div
                            className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                                <span>100% Free</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span>24-48 Hours</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Shield className="h-4 w-4 text-muted-foreground" />
                                <span>Confidential</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            {}
            <section className="container mx-auto px-4 py-12 lg:py-16">
                <div className="mb-10 text-center">
                    <h2 className="mb-3 text-2xl font-bold tracking-tight sm:text-3xl">What You&apos;ll Get</h2>
                    <p className="text-muted-foreground">Our comprehensive assessment report provides everything you need to make informed decisions.
                                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {benefits.map(benefit => <Card key={benefit.title}>
                        <CardHeader className="pb-3 pt-6">
                            <div
                                className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                                <benefit.icon className="h-5 w-5" />
                            </div>
                            <CardTitle className="text-base">{benefit.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <CardDescription>{benefit.description}</CardDescription>
                        </CardContent>
                    </Card>)}
                </div>
            </section>
            {}
            <section className="border-y bg-muted/30">
                <div className="container mx-auto px-4 py-12 lg:py-16">
                    <div className="mb-10 text-center">
                        <h2 className="mb-3 text-2xl font-bold tracking-tight sm:text-3xl">How It Works</h2>
                        <p className="text-muted-foreground">A simple four-step process to get your personalized study plan.
                                        </p>
                    </div>
                    <div className="mx-auto max-w-3xl">
                        <div className="grid gap-6 sm:grid-cols-2">
                            {steps.map(step => <div key={step.step} className="flex gap-4">
                                <div
                                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground text-sm font-bold text-background">
                                    {step.step}
                                </div>
                                <div>
                                    <h3 className="mb-1 font-semibold">{step.title}</h3>
                                    <p className="text-sm text-muted-foreground">{step.description}</p>
                                </div>
                            </div>)}
                        </div>
                    </div>
                </div>
            </section>
            {}
            <section className="container mx-auto px-4 py-12 lg:py-16">
                <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
                    <div>
                        <h2 className="mb-3 text-2xl font-bold tracking-tight sm:text-3xl">Comprehensive Assessment Report
                                        </h2>
                        <p className="mb-6 text-muted-foreground">Our AI-powered report covers every aspect of your study abroad journey, ensuring you have all the
                                          information you need to succeed.
                                        </p>
                        <ul className="space-y-3">
                            {features.map(feature => <li key={feature} className="flex items-center gap-3">
                                <CheckCircle2 className="h-4 w-4 shrink-0" />
                                <span className="text-sm">{feature}</span>
                            </li>)}
                        </ul>
                        <div className="mt-8">
                            <Button asChild>
                                <Link href="/assessment/apply">Start Your Assessment
                                                      <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                    <div>
                        <Card className="overflow-hidden">
                            <div className="border-b bg-muted/50 p-4">
                                <div className="flex items-center gap-3">
                                    <FileText className="h-5 w-5" />
                                    <div>
                                        <p className="text-sm font-medium">Your Report</p>
                                        <p className="text-xs text-muted-foreground">AI-Generated Analysis</p>
                                    </div>
                                </div>
                            </div>
                            <CardContent className="p-4">
                                <div className="space-y-3">
                                    <div className="space-y-2">
                                        <div className="h-2 w-3/4 rounded-full bg-muted" />
                                        <div className="h-2 w-full rounded-full bg-muted" />
                                        <div className="h-2 w-5/6 rounded-full bg-muted" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 pt-2">
                                        <div className="rounded-lg border p-3">
                                            <p className="text-xs text-muted-foreground">Universities</p>
                                            <p className="text-lg font-semibold">5+</p>
                                        </div>
                                        <div className="rounded-lg border p-3">
                                            <p className="text-xs text-muted-foreground">Scholarships</p>
                                            <p className="text-lg font-semibold">3+</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>
            {}
            <section className="border-t bg-muted/30">
                <div className="container mx-auto px-4 py-12 lg:py-16">
                    <div className="mb-10 text-center">
                        <h2 className="mb-3 text-2xl font-bold tracking-tight sm:text-3xl">Student Success Stories</h2>
                        <p className="text-muted-foreground">See how our assessment helped students achieve their dreams.
                                        </p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {testimonials.map(testimonial => <Card key={testimonial.name}>
                            <CardContent className="pt-6">
                                <p className="mb-4 text-sm text-muted-foreground">&ldquo;{testimonial.quote}&rdquo;</p>
                                <div className="flex items-center gap-3">
                                    <div
                                        className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                                        <Users className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">{testimonial.name}</p>
                                        <p className="text-xs text-muted-foreground">{testimonial.country}</p>
                                    </div>
                                </div>
                                <p className="mt-4 text-xs text-muted-foreground">{testimonial.program}</p>
                            </CardContent>
                        </Card>)}
                    </div>
                </div>
            </section>
            {}
            <section className="container mx-auto px-4 py-12 lg:py-16">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div className="rounded-lg border p-4 text-center sm:p-6">
                        <p className="text-2xl font-bold sm:text-3xl">10,000+</p>
                        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">Assessments Completed</p>
                    </div>
                    <div className="rounded-lg border p-4 text-center sm:p-6">
                        <p className="text-2xl font-bold sm:text-3xl">150+</p>
                        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">Partner Universities</p>
                    </div>
                    <div className="rounded-lg border p-4 text-center sm:p-6">
                        <p className="text-2xl font-bold sm:text-3xl">95%</p>
                        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">Success Rate</p>
                    </div>
                    <div className="rounded-lg border p-4 text-center sm:p-6">
                        <p className="text-2xl font-bold sm:text-3xl">100+</p>
                        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">Countries Served</p>
                    </div>
                </div>
            </section>
            {}
            <section className="border-t">
                <div className="container mx-auto px-4 py-12 lg:py-16">
                    <Card>
                        <CardContent
                            className="flex flex-col items-center gap-6 p-8 text-center sm:flex-row sm:text-left">
                            <div
                                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-muted">
                                <Globe className="h-7 w-7" />
                            </div>
                            <div className="flex-1">
                                <h2 className="mb-2 text-xl font-bold sm:text-2xl">Ready to Start Your Journey?</h2>
                                <p className="text-muted-foreground">Take the first step towards your dream education in China. Get your free assessment today.
                                                    </p>
                            </div>
                            <Button size="lg" className="w-full sm:w-auto" asChild>
                                <Link href="/assessment/apply">Get Free Assessment
                                                      <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </section>
        </div>
    );
}