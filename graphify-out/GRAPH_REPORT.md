# Graph Report - .  (2026-06-30)

## Corpus Check
- 7 files · ~96,252 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1023 nodes · 1405 edges · 89 communities (78 shown, 11 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 14 edges (avg confidence: 0.81)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Package Dependencies|Package Dependencies]]
- [[_COMMUNITY_UI Primitive Inputs|UI Primitive Inputs]]
- [[_COMMUNITY_Hotel Map Picker|Hotel Map Picker]]
- [[_COMMUNITY_Route Tree Registry|Route Tree Registry]]
- [[_COMMUNITY_Stripe Payments|Stripe Payments]]
- [[_COMMUNITY_Dev Config & Scripts|Dev Config & Scripts]]
- [[_COMMUNITY_Auth Modal & Sidebar|Auth Modal & Sidebar]]
- [[_COMMUNITY_Auth Modal Provider|Auth Modal Provider]]
- [[_COMMUNITY_Landing & Trip Toggle|Landing & Trip Toggle]]
- [[_COMMUNITY_UI Checkbox & Cards|UI Checkbox & Cards]]
- [[_COMMUNITY_Command Palette UI|Command Palette UI]]
- [[_COMMUNITY_Trip Share & Dashboard|Trip Share & Dashboard]]
- [[_COMMUNITY_Lovable Migration Plan|Lovable Migration Plan]]
- [[_COMMUNITY_Trip Paywall & Sharing|Trip Paywall & Sharing]]
- [[_COMMUNITY_TypeScript Config|TypeScript Config]]
- [[_COMMUNITY_Inspire Suggestions|Inspire Suggestions]]
- [[_COMMUNITY_Menubar UI|Menubar UI]]
- [[_COMMUNITY_Language Switcher & i18n|Language Switcher & i18n]]
- [[_COMMUNITY_Button Component|Button Component]]
- [[_COMMUNITY_Auth Session Provider|Auth Session Provider]]
- [[_COMMUNITY_Tripmates Modal|Tripmates Modal]]
- [[_COMMUNITY_Form UI Components|Form UI Components]]
- [[_COMMUNITY_Google Trip Map|Google Trip Map]]
- [[_COMMUNITY_Carousel UI|Carousel UI]]
- [[_COMMUNITY_Supabase Admin Client|Supabase Admin Client]]
- [[_COMMUNITY_Trip Detail Route|Trip Detail Route]]
- [[_COMMUNITY_Brand Logo|Brand Logo]]
- [[_COMMUNITY_Trip Card|Trip Card]]
- [[_COMMUNITY_Onboarding Flow|Onboarding Flow]]
- [[_COMMUNITY_Chart UI|Chart UI]]
- [[_COMMUNITY_AI Assistant Edit Panel|AI Assistant Edit Panel]]
- [[_COMMUNITY_Auth Session Consumers|Auth Session Consumers]]
- [[_COMMUNITY_Context Menu UI|Context Menu UI]]
- [[_COMMUNITY_Dropdown Menu UI|Dropdown Menu UI]]
- [[_COMMUNITY_Email Change Template|Email Change Template]]
- [[_COMMUNITY_Invite Email Template|Invite Email Template]]
- [[_COMMUNITY_Signup Email Template|Signup Email Template]]
- [[_COMMUNITY_Postcard Generator|Postcard Generator]]
- [[_COMMUNITY_AI SDK & Anthropic|AI SDK & Anthropic]]
- [[_COMMUNITY_Itinerary View|Itinerary View]]
- [[_COMMUNITY_Alert Dialog UI|Alert Dialog UI]]
- [[_COMMUNITY_Table UI|Table UI]]
- [[_COMMUNITY_Magic Link Email|Magic Link Email]]
- [[_COMMUNITY_Reauthentication Email|Reauthentication Email]]
- [[_COMMUNITY_Recovery Email Template|Recovery Email Template]]
- [[_COMMUNITY_AI Assistant Route|AI Assistant Route]]
- [[_COMMUNITY_Shadcn Component Registry|Shadcn Component Registry]]
- [[_COMMUNITY_Breadcrumb UI|Breadcrumb UI]]
- [[_COMMUNITY_Drawer UI|Drawer UI]]
- [[_COMMUNITY_Navigation Menu UI|Navigation Menu UI]]
- [[_COMMUNITY_Select UI|Select UI]]
- [[_COMMUNITY_Card UI|Card UI]]
- [[_COMMUNITY_Toggle UI|Toggle UI]]
- [[_COMMUNITY_Supabase Auth Middleware|Supabase Auth Middleware]]
- [[_COMMUNITY_Email Preview Route|Email Preview Route]]
- [[_COMMUNITY_Component Aliases Config|Component Aliases Config]]
- [[_COMMUNITY_OTP Input|OTP Input]]
- [[_COMMUNITY_Destination Autocomplete|Destination Autocomplete]]
- [[_COMMUNITY_Empty State Wrapper|Empty State Wrapper]]
- [[_COMMUNITY_User Profile Route|User Profile Route]]
- [[_COMMUNITY_Tailwind Config|Tailwind Config]]
- [[_COMMUNITY_Cookie Banner|Cookie Banner]]
- [[_COMMUNITY_Date Range Field|Date Range Field]]
- [[_COMMUNITY_Alert UI|Alert UI]]
- [[_COMMUNITY_Auth Email Webhook|Auth Email Webhook]]
- [[_COMMUNITY_App Entry Point|App Entry Point]]
- [[_COMMUNITY_Dashboard Privacy Plan|Dashboard Privacy Plan]]
- [[_COMMUNITY_Sonner Toast|Sonner Toast]]
- [[_COMMUNITY_Accordion UI|Accordion UI]]
- [[_COMMUNITY_Avatar UI|Avatar UI]]
- [[_COMMUNITY_Badge UI|Badge UI]]
- [[_COMMUNITY_API Config & Example|API Config & Example]]
- [[_COMMUNITY_Copilot Chat Route|Copilot Chat Route]]
- [[_COMMUNITY_Contact Page|Contact Page]]
- [[_COMMUNITY_Public Image Assets|Public Image Assets]]
- [[_COMMUNITY_Generic Button|Generic Button]]
- [[_COMMUNITY_Option Card UI|Option Card UI]]
- [[_COMMUNITY_Router Setup|Router Setup]]
- [[_COMMUNITY_Chat API Route|Chat API Route]]
- [[_COMMUNITY_Auth Route|Auth Route]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 81 edges
2. `supabase` - 22 edges
3. `useAuthModal()` - 17 edges
4. `compilerOptions` - 17 edges
5. `fetch()` - 10 edges
6. `BrandLogo()` - 10 edges
7. `useAuthSession()` - 9 edges
8. `requireSupabaseAuth` - 7 edges
9. `generatePostcardDataUrl()` - 7 edges
10. `useSubscription()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `BrandLogo component` --references--> `Itineraya logo wordmark (mark + ITINERAYA text)`  [INFERRED]
  .lovable/plan.md → public/itineraya-logo.png
- `src/routes/_authenticated/route.tsx` --conceptually_related_to--> `src/routes/__root.tsx (app shell)`  [INFERRED]
  .lovable/plan.md → src/routes/README.md
- `Itineraya favicon (coral winding-path mark icon)` --shares_data_with--> `src/assets/itineraya-mark.svg (vector brand mark source)`  [INFERRED]
  public/favicon.png → src/assets/itineraya-mark.svg
- `Itineraya brand mark (coral winding path with 3 dots)` --shares_data_with--> `src/assets/itineraya-mark.svg (vector brand mark source)`  [INFERRED]
  public/itineraya-mark.png → src/assets/itineraya-mark.svg
- `DateRangeField()` --calls--> `cn()`  [EXTRACTED]
  src/components/DateRangeField.tsx → src/lib/utils.ts

## Import Cycles
- 1-file cycle: `src/components/ui/sonner.tsx -> src/components/ui/sonner.tsx`
- 1-file cycle: `src/components/ui/input-otp.tsx -> src/components/ui/input-otp.tsx`

## Communities (89 total, 11 thin omitted)

### Community 0 - "Package Dependencies"
Cohesion: 0.03
Nodes (70): dependencies, ai, @ai-sdk/anthropic, @ai-sdk/openai-compatible, @ai-sdk/react, class-variance-authority, clsx, cmdk (+62 more)

### Community 1 - "UI Primitive Inputs"
Cohesion: 0.05
Nodes (38): Input, Separator, SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay (+30 more)

### Community 2 - "Hotel Map Picker"
Cohesion: 0.07
Nodes (23): HotelSelection, NominatimResult, nominatimReverse(), nominatimSearch(), PIN_ICON, Props, Activity, Day (+15 more)

### Community 3 - "Route Tree Registry"
Cohesion: 0.05
Nodes (37): ApiChatRoute, ApiPublicPaymentsWebhookRoute, AuthenticatedAssistantRoute, AuthenticatedCopilotRoute, AuthenticatedDashboardRoute, AuthenticatedInspireRoute, AuthenticatedNewTripRoute, AuthenticatedOnboardingRoute (+29 more)

### Community 4 - "Stripe Payments"
Cohesion: 0.10
Nodes (23): stripe, Props, StripeEmbeddedCheckout(), CheckoutOptions, CheckoutSessionResult, createCheckoutSession, createPortalSession, PortalSessionResult (+15 more)

### Community 5 - "Dev Config & Scripts"
Cohesion: 0.06
Nodes (31): devDependencies, eslint, eslint-config-prettier, @eslint/js, eslint-plugin-prettier, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals (+23 more)

### Community 6 - "Auth Modal & Sidebar"
Cohesion: 0.10
Nodes (20): AuthModal(), Props, DashboardSidebar(), MOBILE_NAV_ITEMS, MobileBottomBar(), NAV_ITEMS, NavItem, Destination (+12 more)

### Community 7 - "Auth Modal Provider"
Cohesion: 0.11
Nodes (19): AuthModalContext, AuthModalContextValue, OpenOptions, useAuthModal(), AuthModalRouteSync(), AuthModalMode, container, FeaturesSection() (+11 more)

### Community 8 - "Landing & Trip Toggle"
Cohesion: 0.10
Nodes (11): FooterSection(), Props, PublishToggle(), DiscoverableTrip, listPublicTrips, PublicFeedItem, setTripPublic, Route (+3 more)

### Community 9 - "UI Checkbox & Cards"
Cohesion: 0.09
Nodes (13): Checkbox, HoverCardContent, Progress, RadioGroup, RadioGroupItem, ScrollArea, ScrollBar, Slider (+5 more)

### Community 10 - "Command Palette UI"
Cohesion: 0.12
Nodes (16): Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut() (+8 more)

### Community 11 - "Trip Share & Dashboard"
Cohesion: 0.12
Nodes (17): Props, ShareDialog(), AUTUMN, getSeasonalInspirations(), Inspiration, SPRING, SUMMER, weatherEmoji() (+9 more)

### Community 12 - "Lovable Migration Plan"
Cohesion: 0.11
Nodes (20): /auth?mode=signup route, src/routes/_authenticated/route.tsx, BrandLogo component, DashboardSidebar.tsx, Flecha de retroceso global (ArrowLeft back button), HeroSection.tsx (line 109-116), Logo clicable a la home en todas las pantallas, Mostrar barra inferior móvil en pantallas autenticadas excepto indicadas (+12 more)

### Community 13 - "Trip Paywall & Sharing"
Cohesion: 0.15
Nodes (12): PaywallGate(), getDiscoverableTrip, getPublicTrip, PublicTrip, PublicTripActivity, PublicTripDay, useAuthStatus(), DiscoverableTripPage() (+4 more)

### Community 14 - "TypeScript Config"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, jsx, lib, module, moduleResolution, noEmit, noFallthroughCasesInSwitch (+11 more)

### Community 15 - "Inspire Suggestions"
Cohesion: 0.15
Nodes (12): fallbackImage(), Input, suggestDestinations, SuggestedDestination, unsplashImage(), INSPIRE_QUESTIONS, InspireAnswers, InspireOption (+4 more)

### Community 16 - "Menubar UI"
Cohesion: 0.12
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 17 - "Language Switcher & i18n"
Cohesion: 0.17
Nodes (8): LanguageSwitcher(), Props, AppLang, LANGUAGE_OPTIONS, normalizeLang(), SUPPORTED_LANGS, Route, Route

### Community 18 - "Button Component"
Cohesion: 0.17
Nodes (13): Button, ButtonProps, buttonVariants, Calendar(), CalendarDayButton(), Pagination(), PaginationContent, PaginationEllipsis() (+5 more)

### Community 19 - "Auth Session Provider"
Cohesion: 0.17
Nodes (7): AuthSessionContext, AuthSessionContextValue, AuthSessionProvider(), applyLang(), LanguageProvider(), setAppLanguage(), Route

### Community 20 - "Tripmates Modal"
Cohesion: 0.16
Nodes (10): Invite, Member, TripmatesModal(), AcceptInput, acceptInvite, InviteInput, inviteTripmate, ListInput (+2 more)

### Community 21 - "Form UI Components"
Cohesion: 0.14
Nodes (11): FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext, FormItemContextValue, FormLabel (+3 more)

### Community 22 - "Google Trip Map"
Cohesion: 0.14
Nodes (7): Activity, CATEGORY_COLORS, Day, Geo, Pin, Props, Window

### Community 23 - "Carousel UI"
Cohesion: 0.14
Nodes (12): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+4 more)

### Community 24 - "Supabase Admin Client"
Cohesion: 0.15
Nodes (11): supabaseAdmin, CompositeTypes, Constants, Database, DatabaseWithoutInternals, DefaultSchema, Enums, Json (+3 more)

### Community 25 - "Trip Detail Route"
Cohesion: 0.16
Nodes (10): Activity, ActivityCategory, ActivityRow(), bookingForCategory(), BookingInfo, Day, googleMapsUrl(), Itinerary (+2 more)

### Community 26 - "Brand Logo"
Cohesion: 0.17
Nodes (5): HEIGHTS, Size, Variant, Route, Route

### Community 27 - "Trip Card"
Cohesion: 0.27
Nodes (9): TripCard(), TripCardTrip, ResizableHandle(), ResizablePanelGroup(), Skeleton(), SkeletonAvatar(), SkeletonCard(), SkeletonText() (+1 more)

### Community 28 - "Onboarding Flow"
Cohesion: 0.20
Nodes (6): FormData, getTripTypesForDestination(), isBeachDestination(), OnboardingPage(), PrefillData, tripTypeIds

### Community 29 - "Chart UI"
Cohesion: 0.18
Nodes (7): ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartTooltipContent, THEMES

### Community 30 - "AI Assistant Edit Panel"
Cohesion: 0.22
Nodes (7): AssistantEditPanel(), Message, Activity, Day, editItineraryWithAssistant, Input, Itinerary

### Community 31 - "Auth Session Consumers"
Cohesion: 0.36
Nodes (8): useAuthSession(), BrandLogo(), isActiveStatus(), SubscriptionRow, useSubscription(), Plan, PricingPage(), Route

### Community 32 - "Context Menu UI"
Cohesion: 0.20
Nodes (9): ContextMenuCheckboxItem, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuRadioItem, ContextMenuSeparator, ContextMenuShortcut(), ContextMenuSubContent (+1 more)

### Community 33 - "Dropdown Menu UI"
Cohesion: 0.20
Nodes (9): DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut(), DropdownMenuSubContent (+1 more)

### Community 34 - "Email Change Template"
Cohesion: 0.20
Nodes (8): button, container, EmailChangeEmailProps, footer, h1, link, main, text

### Community 35 - "Invite Email Template"
Cohesion: 0.20
Nodes (8): button, container, footer, h1, InviteEmailProps, link, main, text

### Community 36 - "Signup Email Template"
Cohesion: 0.20
Nodes (8): button, container, footer, h1, link, main, SignupEmailProps, text

### Community 37 - "Postcard Generator"
Cohesion: 0.31
Nodes (9): generatePostcardDataUrl(), hashCode(), hexToRgba(), loadImage(), PALETTES, PostcardActivity, PostcardInput, roundRect() (+1 more)

### Community 38 - "AI SDK & Anthropic"
Cohesion: 0.28
Nodes (9): @ai-sdk/anthropic dependency, src/lib/anthropic.server.ts (planned helper), generateJSON({ system, prompt, schema }), src/lib/inspire.functions.ts, src/lib/itinerary-edit.functions.ts, src/lib/itinerary.functions.ts, Lovable AI gateway (Gemini), Migrar IA a Anthropic Claude Haiku 4.5 (+1 more)

### Community 39 - "Itinerary View"
Cohesion: 0.28
Nodes (7): Activity, Day, daySelectorVariants, ItineraryView(), ItineraryViewProps, mockItineraryData, useMicroAnimation()

### Community 40 - "Alert Dialog UI"
Cohesion: 0.22
Nodes (8): AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter(), AlertDialogHeader(), AlertDialogOverlay, AlertDialogTitle

### Community 41 - "Table UI"
Cohesion: 0.22
Nodes (8): Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow

### Community 42 - "Magic Link Email"
Cohesion: 0.22
Nodes (7): button, container, footer, h1, MagicLinkEmailProps, main, text

### Community 43 - "Reauthentication Email"
Cohesion: 0.22
Nodes (7): codeStyle, container, footer, h1, main, ReauthenticationEmailProps, text

### Community 44 - "Recovery Email Template"
Cohesion: 0.22
Nodes (7): button, container, footer, h1, main, RecoveryEmailProps, text

### Community 45 - "AI Assistant Route"
Cohesion: 0.22
Nodes (3): Plan, Route, Trip

### Community 46 - "Shadcn Component Registry"
Cohesion: 0.25
Nodes (7): iconLibrary, registries, rsc, rtl, $schema, style, tsx

### Community 47 - "Breadcrumb UI"
Cohesion: 0.25
Nodes (7): Breadcrumb, BreadcrumbEllipsis(), BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator()

### Community 48 - "Drawer UI"
Cohesion: 0.25
Nodes (6): DrawerContent, DrawerDescription, DrawerFooter(), DrawerHeader(), DrawerOverlay, DrawerTitle

### Community 49 - "Navigation Menu UI"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 50 - "Select UI"
Cohesion: 0.25
Nodes (7): SelectContent, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator, SelectTrigger

### Community 51 - "Card UI"
Cohesion: 0.29
Nodes (6): Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle

### Community 52 - "Toggle UI"
Cohesion: 0.33
Nodes (5): ToggleGroup, ToggleGroupContext, ToggleGroupItem, Toggle, toggleVariants

### Community 53 - "Supabase Auth Middleware"
Cohesion: 0.38
Nodes (5): requireSupabaseAuth, fallbackImage(), generateItinerary, Input, unsplashImage()

### Community 54 - "Email Preview Route"
Cohesion: 0.29
Nodes (6): Route, EMAIL_TEMPLATES, Route, SAMPLE_DATA, Route, FileRoutesByPath

### Community 55 - "Component Aliases Config"
Cohesion: 0.33
Nodes (6): aliases, components, hooks, lib, ui, utils

### Community 56 - "OTP Input"
Cohesion: 0.40
Nodes (5): input-otp, InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot

### Community 57 - "Destination Autocomplete"
Cohesion: 0.33
Nodes (3): Props, Suggestion, Window

### Community 58 - "Empty State Wrapper"
Cohesion: 0.33
Nodes (4): defaultIconPaths, EmptyStateWrapper(), EmptyStateWrapperProps, ParticleProps

### Community 59 - "User Profile Route"
Cohesion: 0.33
Nodes (5): BUDGET_RANGES, ProfilePage(), Route, TRAVEL_STYLES, TRAVELER_TYPES

### Community 60 - "Tailwind Config"
Cohesion: 0.40
Nodes (5): tailwind, baseColor, css, cssVariables, prefix

### Community 62 - "Date Range Field"
Cohesion: 0.50
Nodes (3): DateRangeField(), Props, PopoverContent

### Community 63 - "Alert UI"
Cohesion: 0.40
Nodes (4): Alert, AlertDescription, AlertTitle, alertVariants

### Community 64 - "Auth Email Webhook"
Cohesion: 0.40
Nodes (3): EMAIL_SUBJECTS, EMAIL_TEMPLATES, Route

### Community 67 - "Dashboard Privacy Plan"
Cohesion: 0.50
Nodes (4): src/routes/_authenticated/dashboard.tsx trips query (line 86-89), Bug crítico de privacidad en "Mis viajes", saved_inspirations and other dashboard/profile queries audit, trips RLS policies

### Community 69 - "Accordion UI"
Cohesion: 0.50
Nodes (3): AccordionContent, AccordionItem, AccordionTrigger

### Community 70 - "Avatar UI"
Cohesion: 0.50
Nodes (3): Avatar, AvatarFallback, AvatarImage

### Community 71 - "Badge UI"
Cohesion: 0.67
Nodes (3): Badge(), BadgeProps, badgeVariants

### Community 75 - "Public Image Assets"
Cohesion: 0.67
Nodes (3): Hero background illustration (faint map/plane/clouds in light blue), Phone mockup showing itinerary route map UI, Steps illustration (location pin -> calendar icons, onboarding flow)

## Knowledge Gaps
- **552 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `css` (+547 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Trip Card` to `UI Primitive Inputs`, `UI Checkbox & Cards`, `Command Palette UI`, `Inspire Suggestions`, `Menubar UI`, `Button Component`, `Form UI Components`, `Carousel UI`, `Chart UI`, `Context Menu UI`, `Dropdown Menu UI`, `Itinerary View`, `Alert Dialog UI`, `Table UI`, `Breadcrumb UI`, `Drawer UI`, `Navigation Menu UI`, `Select UI`, `Card UI`, `Toggle UI`, `OTP Input`, `Empty State Wrapper`, `Date Range Field`, `Alert UI`, `Accordion UI`, `Avatar UI`, `Badge UI`?**
  _High betweenness centrality (0.221) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Package Dependencies` to `OTP Input`, `Stripe Payments`, `Sonner Toast`, `Dev Config & Scripts`?**
  _High betweenness centrality (0.219) - this node is a cross-community bridge._
- **Why does `sonner` connect `Sonner Toast` to `Package Dependencies`?**
  _High betweenness centrality (0.111) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _553 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Package Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.02857142857142857 - nodes in this community are weakly interconnected._
- **Should `UI Primitive Inputs` be split into smaller, more focused modules?**
  _Cohesion score 0.052525252525252523 - nodes in this community are weakly interconnected._
- **Should `Hotel Map Picker` be split into smaller, more focused modules?**
  _Cohesion score 0.06685633001422475 - nodes in this community are weakly interconnected._