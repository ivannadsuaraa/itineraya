# Graph Report - .  (2026-07-02)

## Corpus Check
- 204 files · ~105,223 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1062 nodes · 1611 edges · 90 communities (77 shown, 13 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 18 edges (avg confidence: 0.6)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Auth Modal System|Auth Modal System]]
- [[_COMMUNITY_Dependencies & AI SDK|Dependencies & AI SDK]]
- [[_COMMUNITY_Auth Session Layer|Auth Session Layer]]
- [[_COMMUNITY_UI Primitives (shadcn)|UI Primitives (shadcn)]]
- [[_COMMUNITY_Router & Route Tree|Router & Route Tree]]
- [[_COMMUNITY_Dev Tooling & Config|Dev Tooling & Config]]
- [[_COMMUNITY_Trip Input Components|Trip Input Components]]
- [[_COMMUNITY_Map & Location|Map & Location]]
- [[_COMMUNITY_Payments & Stripe|Payments & Stripe]]
- [[_COMMUNITY_Form & Date Controls|Form & Date Controls]]
- [[_COMMUNITY_Command Palette UI|Command Palette UI]]
- [[_COMMUNITY_TypeScript Config|TypeScript Config]]
- [[_COMMUNITY_Destination Inspiration|Destination Inspiration]]
- [[_COMMUNITY_Brand & Logo Assets|Brand & Logo Assets]]
- [[_COMMUNITY_Menubar UI|Menubar UI]]
- [[_COMMUNITY_Module 15|Module 15]]
- [[_COMMUNITY_Module 16|Module 16]]
- [[_COMMUNITY_Module 17|Module 17]]
- [[_COMMUNITY_Module 18|Module 18]]
- [[_COMMUNITY_Module 19|Module 19]]
- [[_COMMUNITY_Module 20|Module 20]]
- [[_COMMUNITY_Module 21|Module 21]]
- [[_COMMUNITY_Module 22|Module 22]]
- [[_COMMUNITY_Module 23|Module 23]]
- [[_COMMUNITY_Module 24|Module 24]]
- [[_COMMUNITY_Module 25|Module 25]]
- [[_COMMUNITY_Module 26|Module 26]]
- [[_COMMUNITY_Module 27|Module 27]]
- [[_COMMUNITY_Module 28|Module 28]]
- [[_COMMUNITY_Module 29|Module 29]]
- [[_COMMUNITY_Module 30|Module 30]]
- [[_COMMUNITY_Module 31|Module 31]]
- [[_COMMUNITY_Module 32|Module 32]]
- [[_COMMUNITY_Module 33|Module 33]]
- [[_COMMUNITY_Module 34|Module 34]]
- [[_COMMUNITY_Module 35|Module 35]]
- [[_COMMUNITY_Module 36|Module 36]]
- [[_COMMUNITY_Module 37|Module 37]]
- [[_COMMUNITY_Module 38|Module 38]]
- [[_COMMUNITY_Module 39|Module 39]]
- [[_COMMUNITY_Module 40|Module 40]]
- [[_COMMUNITY_Module 41|Module 41]]
- [[_COMMUNITY_Module 42|Module 42]]
- [[_COMMUNITY_Module 43|Module 43]]
- [[_COMMUNITY_Module 44|Module 44]]
- [[_COMMUNITY_Module 45|Module 45]]
- [[_COMMUNITY_Module 46|Module 46]]
- [[_COMMUNITY_Module 47|Module 47]]
- [[_COMMUNITY_Module 48|Module 48]]
- [[_COMMUNITY_Module 49|Module 49]]
- [[_COMMUNITY_Module 50|Module 50]]
- [[_COMMUNITY_Module 51|Module 51]]
- [[_COMMUNITY_Module 52|Module 52]]
- [[_COMMUNITY_Module 53|Module 53]]
- [[_COMMUNITY_Module 54|Module 54]]
- [[_COMMUNITY_Module 55|Module 55]]
- [[_COMMUNITY_Module 56|Module 56]]
- [[_COMMUNITY_Module 57|Module 57]]
- [[_COMMUNITY_Module 58|Module 58]]
- [[_COMMUNITY_Module 59|Module 59]]
- [[_COMMUNITY_Module 60|Module 60]]
- [[_COMMUNITY_Module 61|Module 61]]
- [[_COMMUNITY_Module 62|Module 62]]
- [[_COMMUNITY_Module 63|Module 63]]
- [[_COMMUNITY_Module 64|Module 64]]
- [[_COMMUNITY_Module 65|Module 65]]
- [[_COMMUNITY_Module 66|Module 66]]
- [[_COMMUNITY_Module 67|Module 67]]
- [[_COMMUNITY_Module 68|Module 68]]
- [[_COMMUNITY_Module 69|Module 69]]
- [[_COMMUNITY_Module 70|Module 70]]
- [[_COMMUNITY_Module 71|Module 71]]
- [[_COMMUNITY_Module 72|Module 72]]
- [[_COMMUNITY_Module 73|Module 73]]
- [[_COMMUNITY_Module 74|Module 74]]
- [[_COMMUNITY_Module 75|Module 75]]
- [[_COMMUNITY_Module 76|Module 76]]
- [[_COMMUNITY_Module 77|Module 77]]
- [[_COMMUNITY_Module 78|Module 78]]
- [[_COMMUNITY_Module 82|Module 82]]
- [[_COMMUNITY_Module 84|Module 84]]
- [[_COMMUNITY_Module 85|Module 85]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 82 edges
2. `FileRoutesByPath` - 30 edges
3. `supabase` - 28 edges
4. `useAuthModal()` - 19 edges
5. `compilerOptions` - 17 edges
6. `Itineraya` - 15 edges
7. `_authenticated/ Layout` - 11 edges
8. `BrandLogo()` - 10 edges
9. `fetch()` - 10 edges
10. `useAuthSession()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `nominatimReverse()` --calls--> `fetch()`  [INFERRED]
  src/components/HotelMapPicker.tsx → src/server.ts
- `Anthropic Migration Plan` --references--> `itinerary-edit.functions.ts`  [EXTRACTED]
  .lovable/plan.md → CLAUDE.md
- `Anthropic Migration Plan` --references--> `inspire.functions.ts`  [EXTRACTED]
  .lovable/plan.md → CLAUDE.md
- `Anthropic Migration Plan` --references--> `/api/chat endpoint`  [EXTRACTED]
  .lovable/plan.md → CLAUDE.md
- `nominatimSearch()` --calls--> `fetch()`  [INFERRED]
  src/components/HotelMapPicker.tsx → src/server.ts

## Import Cycles
- 1-file cycle: `src/components/ui/sonner.tsx -> src/components/ui/sonner.tsx`
- 1-file cycle: `src/components/ui/input-otp.tsx -> src/components/ui/input-otp.tsx`

## Hyperedges (group relationships)
- **AI Itinerary Generation Flow** —  [INFERRED]
- **Assistant Access Control** —  [EXTRACTED]
- **Subscription & Payment Flow** —  [INFERRED]

## Communities (90 total, 13 thin omitted)

### Community 0 - "Auth Modal System"
Cohesion: 0.05
Nodes (48): AuthModalContext, AuthModalContextValue, OpenOptions, useAuthModal(), AuthModalRouteSync(), AuthModal(), AuthModalMode, Props (+40 more)

### Community 1 - "Dependencies & AI SDK"
Cohesion: 0.03
Nodes (67): dependencies, ai, @ai-sdk/openai-compatible, @ai-sdk/react, class-variance-authority, clsx, cmdk, culori (+59 more)

### Community 2 - "Auth Session Layer"
Cohesion: 0.06
Nodes (41): AuthModalProvider(), AuthSessionContext, AuthSessionContextValue, AuthSessionProvider(), useAuthSession(), CookieBanner(), Prefs, applyLang() (+33 more)

### Community 3 - "UI Primitives (shadcn)"
Cohesion: 0.05
Nodes (38): Input, Separator, SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay (+30 more)

### Community 4 - "Router & Route Tree"
Cohesion: 0.05
Nodes (39): getRouter(), ApiChatRoute, ApiPublicPaymentsWebhookRoute, AuthenticatedAssistantRoute, AuthenticatedCopilotRoute, AuthenticatedDashboardRoute, AuthenticatedInspireRoute, AuthenticatedNewTripRoute (+31 more)

### Community 5 - "Dev Tooling & Config"
Cohesion: 0.06
Nodes (32): devDependencies, eslint, eslint-config-prettier, @eslint/js, eslint-plugin-prettier, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals (+24 more)

### Community 6 - "Trip Input Components"
Cohesion: 0.08
Nodes (18): DateRangeField(), DestinationAutocomplete(), Props, Suggestion, Window, HotelMapPicker(), HotelSelection, NominatimResult (+10 more)

### Community 7 - "Map & Location"
Cohesion: 0.10
Nodes (17): nominatimSearch(), Activity, Day, DAY_COLORS, Geo, geocode(), Pin, Props (+9 more)

### Community 8 - "Payments & Stripe"
Cohesion: 0.13
Nodes (18): payments.functions.ts, stripe.ts / stripe.server.ts, stripe, CheckoutSessionResult, createPortalSession, PortalSessionResult, createNativeStripeClient(), getConnectionApiKey() (+10 more)

### Community 9 - "Form & Date Controls"
Cohesion: 0.09
Nodes (12): Props, Checkbox, HoverCardContent, PopoverContent, Progress, RadioGroup, RadioGroupItem, ScrollArea (+4 more)

### Community 10 - "Command Palette UI"
Cohesion: 0.12
Nodes (15): Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut() (+7 more)

### Community 11 - "TypeScript Config"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, jsx, lib, module, moduleResolution, noEmit, noFallthroughCasesInSwitch (+11 more)

### Community 12 - "Destination Inspiration"
Cohesion: 0.15
Nodes (12): fallbackImage(), Input, suggestDestinations, SuggestedDestination, unsplashImage(), INSPIRE_QUESTIONS, InspireAnswers, InspireOption (+4 more)

### Community 13 - "Brand & Logo Assets"
Cohesion: 0.14
Nodes (7): BrandLogo(), HEIGHTS, Size, Variant, Route, Route, Route

### Community 14 - "Menubar UI"
Cohesion: 0.12
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 15 - "Module 15"
Cohesion: 0.15
Nodes (14): AUTUMN, getSeasonalInspirations(), Inspiration, SPRING, SUMMER, weatherEmoji(), WINTER, DashboardPage() (+6 more)

### Community 16 - "Module 16"
Cohesion: 0.17
Nodes (13): Button, ButtonProps, buttonVariants, Calendar(), CalendarDayButton(), Pagination(), PaginationContent, PaginationEllipsis() (+5 more)

### Community 17 - "Module 17"
Cohesion: 0.14
Nodes (11): FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext, FormItemContextValue, FormLabel (+3 more)

### Community 18 - "Module 18"
Cohesion: 0.14
Nodes (11): File-based Routing, Itineraya, resend, React 19, Resend, routeTree.gen.ts, Tailwind CSS v4, TanStack Router (+3 more)

### Community 19 - "Module 19"
Cohesion: 0.16
Nodes (10): sonner, AssistantEditPanel(), Message, Toaster(), ToasterProps, Activity, Day, editItineraryWithAssistant (+2 more)

### Community 20 - "Module 20"
Cohesion: 0.14
Nodes (7): Activity, CATEGORY_COLORS, Day, Geo, Pin, Props, Window

### Community 21 - "Module 21"
Cohesion: 0.15
Nodes (8): Props, PublishToggle(), DiscoverableTrip, getDiscoverableTrip, listPublicTrips, PublicFeedItem, setTripPublic, PublicTrip

### Community 22 - "Module 22"
Cohesion: 0.14
Nodes (12): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+4 more)

### Community 23 - "Module 23"
Cohesion: 0.15
Nodes (11): supabaseAdmin, CompositeTypes, Constants, Database, DatabaseWithoutInternals, DefaultSchema, Enums, Json (+3 more)

### Community 24 - "Module 24"
Cohesion: 0.16
Nodes (10): Activity, ActivityCategory, ActivityRow(), bookingForCategory(), BookingInfo, Day, googleMapsUrl(), Itinerary (+2 more)

### Community 25 - "Module 25"
Cohesion: 0.19
Nodes (13): @ai-sdk/anthropic, Anthropic API, ANTHROPIC_API_KEY, /api/chat endpoint, claude-haiku-4-5, createServerFn(), Anthropic Migration Plan, inspire.functions.ts (+5 more)

### Community 26 - "Module 26"
Cohesion: 0.17
Nodes (13): _authenticated/ Layout, DashboardSidebar.tsx, MobileBottomBar, __root.tsx, Copilot (copilot.tsx), Dashboard (dashboard.tsx), Inspire (inspire.tsx), New Trip (new-trip.tsx) (+5 more)

### Community 27 - "Module 27"
Cohesion: 0.15
Nodes (10): Route, Route, Route, Route, Route, Route, Route, Route (+2 more)

### Community 28 - "Module 28"
Cohesion: 0.27
Nodes (9): TripCard(), TripCardTrip, ResizableHandle(), ResizablePanelGroup(), Skeleton(), SkeletonAvatar(), SkeletonCard(), SkeletonText() (+1 more)

### Community 29 - "Module 29"
Cohesion: 0.20
Nodes (9): Invite, Member, TripmatesModal(), AcceptInput, acceptInvite, InviteInput, inviteTripmate, ListInput (+1 more)

### Community 30 - "Module 30"
Cohesion: 0.18
Nodes (7): ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartTooltipContent, THEMES

### Community 31 - "Module 31"
Cohesion: 0.20
Nodes (9): ContextMenuCheckboxItem, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuRadioItem, ContextMenuSeparator, ContextMenuShortcut(), ContextMenuSubContent (+1 more)

### Community 32 - "Module 32"
Cohesion: 0.20
Nodes (9): DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut(), DropdownMenuSubContent (+1 more)

### Community 33 - "Module 33"
Cohesion: 0.20
Nodes (9): button, container, EmailChangeEmail(), EmailChangeEmailProps, footer, h1, link, main (+1 more)

### Community 34 - "Module 34"
Cohesion: 0.31
Nodes (9): generatePostcardDataUrl(), hashCode(), hexToRgba(), loadImage(), PALETTES, PostcardActivity, PostcardInput, roundRect() (+1 more)

### Community 35 - "Module 35"
Cohesion: 0.28
Nodes (7): Activity, Day, daySelectorVariants, ItineraryView(), ItineraryViewProps, mockItineraryData, useMicroAnimation()

### Community 36 - "Module 36"
Cohesion: 0.22
Nodes (8): AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter(), AlertDialogHeader(), AlertDialogOverlay, AlertDialogTitle

### Community 37 - "Module 37"
Cohesion: 0.22
Nodes (8): Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow

### Community 38 - "Module 38"
Cohesion: 0.22
Nodes (8): button, container, footer, h1, InviteEmailProps, link, main, text

### Community 39 - "Module 39"
Cohesion: 0.22
Nodes (8): button, container, footer, h1, MagicLinkEmail(), MagicLinkEmailProps, main, text

### Community 40 - "Module 40"
Cohesion: 0.22
Nodes (8): codeStyle, container, footer, h1, main, ReauthenticationEmail(), ReauthenticationEmailProps, text

### Community 41 - "Module 41"
Cohesion: 0.22
Nodes (8): button, container, footer, h1, main, RecoveryEmail(), RecoveryEmailProps, text

### Community 42 - "Module 42"
Cohesion: 0.22
Nodes (8): button, container, footer, h1, link, main, SignupEmailProps, text

### Community 43 - "Module 43"
Cohesion: 0.22
Nodes (3): Plan, Route, Trip

### Community 44 - "Module 44"
Cohesion: 0.25
Nodes (7): iconLibrary, registries, rsc, rtl, $schema, style, tsx

### Community 45 - "Module 45"
Cohesion: 0.29
Nodes (3): Props, ShareDialog(), enableTripShare

### Community 46 - "Module 46"
Cohesion: 0.25
Nodes (7): Breadcrumb, BreadcrumbEllipsis(), BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator()

### Community 47 - "Module 47"
Cohesion: 0.25
Nodes (6): DrawerContent, DrawerDescription, DrawerFooter(), DrawerHeader(), DrawerOverlay, DrawerTitle

### Community 48 - "Module 48"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 49 - "Module 49"
Cohesion: 0.25
Nodes (7): SelectContent, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator, SelectTrigger

### Community 50 - "Module 50"
Cohesion: 0.32
Nodes (5): requireSupabaseAuth, fallbackImage(), generateItinerary, Input, unsplashImage()

### Community 51 - "Module 51"
Cohesion: 0.33
Nodes (7): auth-middleware.ts, subscriptions table, trips table, Privacy Bug Fix (trips RLS), Supabase RLS Policies, Supabase, Supabase Integration (integrations/supabase/)

### Community 52 - "Module 52"
Cohesion: 0.29
Nodes (6): Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle

### Community 53 - "Module 53"
Cohesion: 0.33
Nodes (5): ToggleGroup, ToggleGroupContext, ToggleGroupItem, Toggle, toggleVariants

### Community 54 - "Module 54"
Cohesion: 0.33
Nodes (3): Landing Components (landing/), HeroSection.tsx, Landing Page (index.tsx)

### Community 55 - "Module 55"
Cohesion: 0.33
Nodes (6): aliases, components, hooks, lib, ui, utils

### Community 56 - "Module 56"
Cohesion: 0.33
Nodes (6): profiles table, Explorador Plan, Free Plan, Viajero Plan, Assistant (assistant.tsx), UpgradeGate Component

### Community 57 - "Module 57"
Cohesion: 0.40
Nodes (5): input-otp, InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot

### Community 58 - "Module 58"
Cohesion: 0.33
Nodes (4): defaultIconPaths, EmptyStateWrapper(), EmptyStateWrapperProps, ParticleProps

### Community 60 - "Module 60"
Cohesion: 0.40
Nodes (5): tailwind, baseColor, css, cssVariables, prefix

### Community 61 - "Module 61"
Cohesion: 0.40
Nodes (4): Alert, AlertDescription, AlertTitle, alertVariants

### Community 62 - "Module 62"
Cohesion: 0.40
Nodes (4): InviteEmail(), EMAIL_TEMPLATES, Route, SAMPLE_DATA

### Community 63 - "Module 63"
Cohesion: 0.40
Nodes (3): SignupEmail(), EMAIL_SUBJECTS, EMAIL_TEMPLATES

### Community 66 - "Module 66"
Cohesion: 0.50
Nodes (3): AccordionContent, AccordionItem, AccordionTrigger

### Community 67 - "Module 67"
Cohesion: 0.50
Nodes (3): Avatar, AvatarFallback, AvatarImage

### Community 68 - "Module 68"
Cohesion: 0.67
Nodes (3): Badge(), BadgeProps, badgeVariants

### Community 69 - "Module 69"
Cohesion: 0.50
Nodes (3): TabsContent, TabsList, TabsTrigger

### Community 73 - "Module 73"
Cohesion: 0.67
Nodes (3): UI Components (ui/), Radix UI, shadcn/ui

### Community 74 - "Module 74"
Cohesion: 0.67
Nodes (3): i18n Locales (es.json, en.json), i18next, i18next

## Knowledge Gaps
- **530 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `css` (+525 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Module 28` to `UI Primitives (shadcn)`, `Trip Input Components`, `Form & Date Controls`, `Command Palette UI`, `Destination Inspiration`, `Menubar UI`, `Module 16`, `Module 17`, `Module 22`, `Module 30`, `Module 31`, `Module 32`, `Module 35`, `Module 36`, `Module 37`, `Module 46`, `Module 47`, `Module 48`, `Module 49`, `Module 52`, `Module 53`, `Module 57`, `Module 58`, `Module 61`, `Module 66`, `Module 67`, `Module 68`, `Module 69`?**
  _High betweenness centrality (0.234) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Dependencies & AI SDK` to `Dev Tooling & Config`, `Payments & Stripe`, `Module 74`, `Module 18`, `Module 19`, `Module 25`, `Module 57`?**
  _High betweenness centrality (0.172) - this node is a cross-community bridge._
- **Why does `sonner` connect `Module 19` to `Dependencies & AI SDK`?**
  _High betweenness centrality (0.077) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _530 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Auth Modal System` be split into smaller, more focused modules?**
  _Cohesion score 0.050617283950617285 - nodes in this community are weakly interconnected._
- **Should `Dependencies & AI SDK` be split into smaller, more focused modules?**
  _Cohesion score 0.029850746268656716 - nodes in this community are weakly interconnected._
- **Should `Auth Session Layer` be split into smaller, more focused modules?**
  _Cohesion score 0.05875706214689266 - nodes in this community are weakly interconnected._