# Graph Report - .  (2026-06-30)

## Corpus Check
- 9 files · ~96,417 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1032 nodes · 1528 edges · 90 communities (81 shown, 9 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 14 edges (avg confidence: 0.81)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Package Dependencies|Package Dependencies]]
- [[_COMMUNITY_Auth & Landing Pages|Auth & Landing Pages]]
- [[_COMMUNITY_Stripe Payments & Subscriptions|Stripe Payments & Subscriptions]]
- [[_COMMUNITY_Sidebar & App Shell UI|Sidebar & App Shell UI]]
- [[_COMMUNITY_Public Explore & Share|Public Explore & Share]]
- [[_COMMUNITY_Generated Route Tree|Generated Route Tree]]
- [[_COMMUNITY_i18n, Cookies & Error Providers|i18n, Cookies & Error Providers]]
- [[_COMMUNITY_Package Dev Dependencies & Scripts|Package Dev Dependencies & Scripts]]
- [[_COMMUNITY_Onboarding, Brand Logo & Subscription State|Onboarding, Brand Logo & Subscription State]]
- [[_COMMUNITY_Trip Map, Server Entry & Error Capture|Trip Map, Server Entry & Error Capture]]
- [[_COMMUNITY_Form Inputs & Utils|Form Inputs & Utils]]
- [[_COMMUNITY_Dashboard|Dashboard]]
- [[_COMMUNITY_New Trip & Command Dialog|New Trip & Command Dialog]]
- [[_COMMUNITY_Lovable Plan Branding & Routing Notes|Lovable Plan: Branding & Routing Notes]]
- [[_COMMUNITY_Trip Card, Drawer & Skeleton UI|Trip Card, Drawer & Skeleton UI]]
- [[_COMMUNITY_TypeScript Config|TypeScript Config]]
- [[_COMMUNITY_Inspire Feature|Inspire Feature]]
- [[_COMMUNITY_Menubar UI|Menubar UI]]
- [[_COMMUNITY_Auth Session, Language & Checkout Return|Auth Session, Language & Checkout Return]]
- [[_COMMUNITY_Button, Calendar & Pagination UI|Button, Calendar & Pagination UI]]
- [[_COMMUNITY_Tripmates & Invites|Tripmates & Invites]]
- [[_COMMUNITY_Form & Label UI|Form & Label UI]]
- [[_COMMUNITY_Google Trip Map|Google Trip Map]]
- [[_COMMUNITY_Carousel UI|Carousel UI]]
- [[_COMMUNITY_Trip Itinerary Route|Trip Itinerary Route]]
- [[_COMMUNITY_Misc Route Tree Entries|Misc Route Tree Entries]]
- [[_COMMUNITY_Chart UI|Chart UI]]
- [[_COMMUNITY_Assistant Edit Panel|Assistant Edit Panel]]
- [[_COMMUNITY_Context Menu UI|Context Menu UI]]
- [[_COMMUNITY_Dropdown Menu UI|Dropdown Menu UI]]
- [[_COMMUNITY_Email Template Email Change|Email Template: Email Change]]
- [[_COMMUNITY_Email Template Invite|Email Template: Invite]]
- [[_COMMUNITY_Postcard Generator|Postcard Generator]]
- [[_COMMUNITY_Lovable Plan Anthropic AI Migration|Lovable Plan: Anthropic AI Migration]]
- [[_COMMUNITY_Itinerary View & Micro Animation|Itinerary View & Micro Animation]]
- [[_COMMUNITY_Alert Dialog UI|Alert Dialog UI]]
- [[_COMMUNITY_Table UI|Table UI]]
- [[_COMMUNITY_Email Template Magic Link|Email Template: Magic Link]]
- [[_COMMUNITY_Email Template Reauthentication|Email Template: Reauthentication]]
- [[_COMMUNITY_Email Template Recovery|Email Template: Recovery]]
- [[_COMMUNITY_Email Template Signup|Email Template: Signup]]
- [[_COMMUNITY_Assistant Route & Chat|Assistant Route & Chat]]
- [[_COMMUNITY_Components.json Schema|Components.json Schema]]
- [[_COMMUNITY_Publish Toggle & Toasts|Publish Toggle & Toasts]]
- [[_COMMUNITY_Breadcrumb UI|Breadcrumb UI]]
- [[_COMMUNITY_Navigation Menu UI|Navigation Menu UI]]
- [[_COMMUNITY_Select UI|Select UI]]
- [[_COMMUNITY_Card UI|Card UI]]
- [[_COMMUNITY_Toggle UI|Toggle UI]]
- [[_COMMUNITY_Components.json Aliases|Components.json Aliases]]
- [[_COMMUNITY_Input OTP UI|Input OTP UI]]
- [[_COMMUNITY_Empty State Wrapper UI|Empty State Wrapper UI]]
- [[_COMMUNITY_Email Queue Processor|Email Queue Processor]]
- [[_COMMUNITY_Components.json Tailwind Config|Components.json Tailwind Config]]
- [[_COMMUNITY_Alert UI|Alert UI]]
- [[_COMMUNITY_Email Auth Preview Route|Email Auth Preview Route]]
- [[_COMMUNITY_Itinerary Generation Functions|Itinerary Generation Functions]]
- [[_COMMUNITY_Router & Start Instance|Router & Start Instance]]
- [[_COMMUNITY_Email Auth Webhook|Email Auth Webhook]]
- [[_COMMUNITY_Terms Route|Terms Route]]
- [[_COMMUNITY_Index & Swipe Demo Files|Index & Swipe Demo Files]]
- [[_COMMUNITY_Lovable Plan PrivacyRLS Bug Fix|Lovable Plan: Privacy/RLS Bug Fix]]
- [[_COMMUNITY_Accordion UI|Accordion UI]]
- [[_COMMUNITY_Avatar UI|Avatar UI]]
- [[_COMMUNITY_Badge UI|Badge UI]]
- [[_COMMUNITY_Tabs UI|Tabs UI]]
- [[_COMMUNITY_API Example & Server Config|API Example & Server Config]]
- [[_COMMUNITY_Contact Route|Contact Route]]
- [[_COMMUNITY_Onboarding & Hero Images|Onboarding & Hero Images]]
- [[_COMMUNITY_Legacy Button.js Component|Legacy Button.js Component]]
- [[_COMMUNITY_Option Card UI|Option Card UI]]
- [[_COMMUNITY_Geocode Functions|Geocode Functions]]
- [[_COMMUNITY_Animated Gradient Background|Animated Gradient Background]]
- [[_COMMUNITY_AI Gateway Server|AI Gateway Server]]
- [[_COMMUNITY_ESLint Config|ESLint Config]]
- [[_COMMUNITY_Stray onboarding.tsx|Stray onboarding.tsx]]
- [[_COMMUNITY_Aspect Ratio UI|Aspect Ratio UI]]
- [[_COMMUNITY_Collapsible UI|Collapsible UI]]
- [[_COMMUNITY_Vite Config|Vite Config]]
- [[_COMMUNITY_Button Component|Button Component]]
- [[_COMMUNITY_Option Card UI|Option Card UI]]
- [[_COMMUNITY_Geocode Lookup|Geocode Lookup]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 82 edges
2. `FileRoutesByPath` - 30 edges
3. `supabase` - 23 edges
4. `useAuthModal()` - 17 edges
5. `compilerOptions` - 17 edges
6. `fetch()` - 10 edges
7. `BrandLogo()` - 10 edges
8. `useAuthSession()` - 9 edges
9. `requireSupabaseAuth` - 7 edges
10. `generatePostcardDataUrl()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `BrandLogo component` --references--> `Itineraya logo wordmark (mark + ITINERAYA text)`  [INFERRED]
  .lovable/plan.md → public/itineraya-logo.png
- `src/routes/_authenticated/route.tsx` --conceptually_related_to--> `src/routes/__root.tsx (app shell)`  [INFERRED]
  .lovable/plan.md → src/routes/README.md
- `Itineraya favicon (coral winding-path mark icon)` --shares_data_with--> `src/assets/itineraya-mark.svg (vector brand mark source)`  [INFERRED]
  public/favicon.png → src/assets/itineraya-mark.svg
- `Itineraya brand mark (coral winding path with 3 dots)` --shares_data_with--> `src/assets/itineraya-mark.svg (vector brand mark source)`  [INFERRED]
  public/itineraya-mark.png → src/assets/itineraya-mark.svg
- `nominatimSearch()` --calls--> `fetch()`  [INFERRED]
  src/components/HotelMapPicker.tsx → src/server.ts

## Import Cycles
- 1-file cycle: `src/components/ui/sonner.tsx -> src/components/ui/sonner.tsx`
- 1-file cycle: `src/components/ui/input-otp.tsx -> src/components/ui/input-otp.tsx`

## Communities (90 total, 9 thin omitted)

### Community 0 - "Package Dependencies"
Cohesion: 0.03
Nodes (71): dependencies, ai, @ai-sdk/anthropic, @ai-sdk/openai-compatible, @ai-sdk/react, class-variance-authority, clsx, cmdk (+63 more)

### Community 1 - "Auth & Landing Pages"
Cohesion: 0.05
Nodes (38): Input, Separator, SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay (+30 more)

### Community 2 - "Stripe Payments & Subscriptions"
Cohesion: 0.05
Nodes (40): getRouter(), Route, ApiChatRoute, ApiPublicPaymentsWebhookRoute, AuthenticatedAssistantRoute, AuthenticatedCopilotRoute, AuthenticatedDashboardRoute, AuthenticatedInspireRoute (+32 more)

### Community 3 - "Sidebar & App Shell UI"
Cohesion: 0.10
Nodes (23): stripe, Props, StripeEmbeddedCheckout(), CheckoutOptions, CheckoutSessionResult, createCheckoutSession, createPortalSession, PortalSessionResult (+15 more)

### Community 4 - "Public Explore & Share"
Cohesion: 0.06
Nodes (31): devDependencies, eslint, eslint-config-prettier, @eslint/js, eslint-plugin-prettier, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals (+23 more)

### Community 5 - "Generated Route Tree"
Cohesion: 0.09
Nodes (24): DashboardSidebar(), MOBILE_NAV_ITEMS, MobileBottomBar(), NAV_ITEMS, NavItem, AUTUMN, fetchWeather(), getSeasonalInspirations() (+16 more)

### Community 6 - "i18n, Cookies & Error Providers"
Cohesion: 0.08
Nodes (16): supabaseAdmin, CompositeTypes, Constants, Database, DatabaseWithoutInternals, DefaultSchema, Enums, Json (+8 more)

### Community 7 - "Package Dev Dependencies & Scripts"
Cohesion: 0.08
Nodes (14): Avatar, AvatarFallback, AvatarImage, Checkbox, HoverCardContent, labelVariants, Progress, RadioGroup (+6 more)

### Community 8 - "Onboarding, Brand Logo & Subscription State"
Cohesion: 0.14
Nodes (16): useAuthSession(), BrandLogo(), HEIGHTS, Size, Variant, isActiveStatus(), SubscriptionRow, useSubscription() (+8 more)

### Community 9 - "Trip Map, Server Entry & Error Capture"
Cohesion: 0.12
Nodes (16): Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut() (+8 more)

### Community 10 - "Form Inputs & Utils"
Cohesion: 0.11
Nodes (20): /auth?mode=signup route, src/routes/_authenticated/route.tsx, BrandLogo component, DashboardSidebar.tsx, Flecha de retroceso global (ArrowLeft back button), HeroSection.tsx (line 109-116), Logo clicable a la home en todas las pantallas, Mostrar barra inferior móvil en pantallas autenticadas excepto indicadas (+12 more)

### Community 11 - "Dashboard"
Cohesion: 0.14
Nodes (9): LanguageSwitcher(), Props, AppLang, LANGUAGE_OPTIONS, normalizeLang(), SUPPORTED_LANGS, Route, Route (+1 more)

### Community 12 - "New Trip & Command Dialog"
Cohesion: 0.15
Nodes (15): TripCard(), TripCardTrip, DrawerContent, DrawerDescription, DrawerFooter(), DrawerHeader(), DrawerOverlay, DrawerTitle (+7 more)

### Community 13 - "Lovable Plan: Branding & Routing Notes"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, jsx, lib, module, moduleResolution, noEmit, noFallthroughCasesInSwitch (+11 more)

### Community 14 - "Trip Card, Drawer & Skeleton UI"
Cohesion: 0.16
Nodes (10): AuthModalContext, AuthModalContextValue, OpenOptions, AuthModal(), AuthModalMode, Props, PostAuthToastKind, setPendingAuthToast() (+2 more)

### Community 15 - "TypeScript Config"
Cohesion: 0.16
Nodes (13): useAuthModal(), AuthModalRouteSync(), container, FeaturesSection(), item, HeroSection(), container, HowItWorksSection() (+5 more)

### Community 16 - "Inspire Feature"
Cohesion: 0.15
Nodes (12): fallbackImage(), Input, suggestDestinations, SuggestedDestination, unsplashImage(), INSPIRE_QUESTIONS, InspireAnswers, InspireOption (+4 more)

### Community 17 - "Menubar UI"
Cohesion: 0.12
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 18 - "Auth Session, Language & Checkout Return"
Cohesion: 0.16
Nodes (8): AuthSessionContext, AuthSessionContextValue, AuthSessionProvider(), applyLang(), LanguageProvider(), setAppLanguage(), Route, FileRoutesById

### Community 19 - "Button, Calendar & Pagination UI"
Cohesion: 0.17
Nodes (8): FooterSection(), Navbar(), listPublicTrips, PublicFeedItem, Route, DURATIONS, Route, STYLES

### Community 20 - "Tripmates & Invites"
Cohesion: 0.17
Nodes (13): Button, ButtonProps, buttonVariants, Calendar(), CalendarDayButton(), Pagination(), PaginationContent, PaginationEllipsis() (+5 more)

### Community 21 - "Form & Label UI"
Cohesion: 0.14
Nodes (7): Activity, CATEGORY_COLORS, Day, Geo, Pin, Props, Window

### Community 22 - "Google Trip Map"
Cohesion: 0.29
Nodes (7): PaywallGate(), supabase, PublicTripDay, useAuthStatus(), DiscoverableTripPage(), TripMap, PublicTripPage()

### Community 23 - "Carousel UI"
Cohesion: 0.14
Nodes (12): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+4 more)

### Community 24 - "Trip Itinerary Route"
Cohesion: 0.16
Nodes (10): Activity, ActivityCategory, ActivityRow(), bookingForCategory(), BookingInfo, Day, googleMapsUrl(), Itinerary (+2 more)

### Community 25 - "Misc Route Tree Entries"
Cohesion: 0.24
Nodes (9): nominatimReverse(), nominatimSearch(), geocode(), consumeLastCapturedError(), renderErrorPage(), fetch(), getServerEntry(), normalizeCatastrophicSsrResponse() (+1 more)

### Community 26 - "Chart UI"
Cohesion: 0.15
Nodes (10): FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext, FormItemContextValue, FormLabel (+2 more)

### Community 27 - "Assistant Edit Panel"
Cohesion: 0.15
Nodes (9): ChatRequestBody, Route, Route, Route, Route, Route, Route, Route (+1 more)

### Community 28 - "Context Menu UI"
Cohesion: 0.18
Nodes (7): FormData, getTripTypesForDestination(), isBeachDestination(), OnboardingPage(), PrefillData, Route, tripTypeIds

### Community 29 - "Dropdown Menu UI"
Cohesion: 0.20
Nodes (9): Invite, Member, TripmatesModal(), AcceptInput, acceptInvite, InviteInput, inviteTripmate, ListInput (+1 more)

### Community 30 - "Email Template: Email Change"
Cohesion: 0.18
Nodes (6): Activity, Day, DAY_COLORS, Geo, Pin, Props

### Community 31 - "Email Template: Invite"
Cohesion: 0.18
Nodes (7): ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartTooltipContent, THEMES

### Community 32 - "Postcard Generator"
Cohesion: 0.22
Nodes (7): AssistantEditPanel(), Message, Activity, Day, editItineraryWithAssistant, Input, Itinerary

### Community 33 - "Lovable Plan: Anthropic AI Migration"
Cohesion: 0.20
Nodes (9): ContextMenuCheckboxItem, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuRadioItem, ContextMenuSeparator, ContextMenuShortcut(), ContextMenuSubContent (+1 more)

### Community 34 - "Itinerary View & Micro Animation"
Cohesion: 0.20
Nodes (9): DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut(), DropdownMenuSubContent (+1 more)

### Community 35 - "Alert Dialog UI"
Cohesion: 0.20
Nodes (9): button, container, EmailChangeEmail(), EmailChangeEmailProps, footer, h1, link, main (+1 more)

### Community 36 - "Table UI"
Cohesion: 0.20
Nodes (9): button, container, footer, h1, InviteEmail(), InviteEmailProps, link, main (+1 more)

### Community 37 - "Email Template: Magic Link"
Cohesion: 0.31
Nodes (9): generatePostcardDataUrl(), hashCode(), hexToRgba(), loadImage(), PALETTES, PostcardActivity, PostcardInput, roundRect() (+1 more)

### Community 38 - "Email Template: Reauthentication"
Cohesion: 0.28
Nodes (9): @ai-sdk/anthropic dependency, src/lib/anthropic.server.ts (planned helper), generateJSON({ system, prompt, schema }), src/lib/inspire.functions.ts, src/lib/itinerary-edit.functions.ts, src/lib/itinerary.functions.ts, Lovable AI gateway (Gemini), Migrar IA a Anthropic Claude Haiku 4.5 (+1 more)

### Community 39 - "Email Template: Recovery"
Cohesion: 0.28
Nodes (7): Activity, Day, daySelectorVariants, ItineraryView(), ItineraryViewProps, mockItineraryData, useMicroAnimation()

### Community 40 - "Email Template: Signup"
Cohesion: 0.22
Nodes (8): AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter(), AlertDialogHeader(), AlertDialogOverlay, AlertDialogTitle

### Community 41 - "Assistant Route & Chat"
Cohesion: 0.22
Nodes (8): Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow

### Community 42 - "Components.json Schema"
Cohesion: 0.22
Nodes (8): button, container, footer, h1, MagicLinkEmail(), MagicLinkEmailProps, main, text

### Community 43 - "Publish Toggle & Toasts"
Cohesion: 0.22
Nodes (8): codeStyle, container, footer, h1, main, ReauthenticationEmail(), ReauthenticationEmailProps, text

### Community 44 - "Breadcrumb UI"
Cohesion: 0.22
Nodes (8): button, container, footer, h1, main, RecoveryEmail(), RecoveryEmailProps, text

### Community 45 - "Navigation Menu UI"
Cohesion: 0.22
Nodes (8): button, container, footer, h1, link, main, SignupEmailProps, text

### Community 46 - "Select UI"
Cohesion: 0.22
Nodes (3): Plan, Route, Trip

### Community 47 - "Card UI"
Cohesion: 0.25
Nodes (7): iconLibrary, registries, rsc, rtl, $schema, style, tsx

### Community 48 - "Toggle UI"
Cohesion: 0.29
Nodes (5): sonner, Props, ShareDialog(), ToasterProps, enableTripShare

### Community 49 - "Components.json Aliases"
Cohesion: 0.25
Nodes (5): HotelMapPicker(), HotelSelection, NominatimResult, PIN_ICON, Props

### Community 50 - "Input OTP UI"
Cohesion: 0.25
Nodes (7): Breadcrumb, BreadcrumbEllipsis(), BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator()

### Community 51 - "Empty State Wrapper UI"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 52 - "Email Queue Processor"
Cohesion: 0.25
Nodes (7): SelectContent, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator, SelectTrigger

### Community 53 - "Components.json Tailwind Config"
Cohesion: 0.29
Nodes (6): Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle

### Community 54 - "Alert UI"
Cohesion: 0.33
Nodes (5): ToggleGroup, ToggleGroupContext, ToggleGroupItem, Toggle, toggleVariants

### Community 55 - "Email Auth Preview Route"
Cohesion: 0.38
Nodes (5): requireSupabaseAuth, fallbackImage(), generateItinerary, Input, unsplashImage()

### Community 56 - "Itinerary Generation Functions"
Cohesion: 0.33
Nodes (6): aliases, components, hooks, lib, ui, utils

### Community 57 - "Router & Start Instance"
Cohesion: 0.40
Nodes (5): input-otp, InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot

### Community 58 - "Email Auth Webhook"
Cohesion: 0.33
Nodes (4): DestinationAutocomplete(), Props, Suggestion, Window

### Community 59 - "Terms Route"
Cohesion: 0.33
Nodes (4): defaultIconPaths, EmptyStateWrapper(), EmptyStateWrapperProps, ParticleProps

### Community 61 - "Lovable Plan: Privacy/RLS Bug Fix"
Cohesion: 0.40
Nodes (5): tailwind, baseColor, css, cssVariables, prefix

### Community 63 - "Avatar UI"
Cohesion: 0.50
Nodes (3): DateRangeField(), Props, PopoverContent

### Community 64 - "Badge UI"
Cohesion: 0.50
Nodes (4): Destination, DESTINATIONS, encodePrefill(), PopularDestinationsSection()

### Community 65 - "Tabs UI"
Cohesion: 0.40
Nodes (4): Alert, AlertDescription, AlertTitle, alertVariants

### Community 66 - "API Example & Server Config"
Cohesion: 0.40
Nodes (4): SignupEmail(), EMAIL_TEMPLATES, Route, SAMPLE_DATA

### Community 67 - "Contact Route"
Cohesion: 0.40
Nodes (3): LovableErrorOptions, LovableEvents, Window

### Community 68 - "Onboarding & Hero Images"
Cohesion: 0.40
Nodes (3): EMAIL_SUBJECTS, EMAIL_TEMPLATES, Route

### Community 71 - "Geocode Functions"
Cohesion: 0.50
Nodes (4): src/routes/_authenticated/dashboard.tsx trips query (line 86-89), Bug crítico de privacidad en "Mis viajes", saved_inspirations and other dashboard/profile queries audit, trips RLS policies

### Community 72 - "Animated Gradient Background"
Cohesion: 0.50
Nodes (3): Props, PublishToggle(), setTripPublic

### Community 73 - "AI Gateway Server"
Cohesion: 0.50
Nodes (3): AccordionContent, AccordionItem, AccordionTrigger

### Community 74 - "ESLint Config"
Cohesion: 0.67
Nodes (3): Badge(), BadgeProps, badgeVariants

### Community 75 - "Stray onboarding.tsx"
Cohesion: 0.50
Nodes (3): TabsContent, TabsList, TabsTrigger

### Community 78 - "Vite Config"
Cohesion: 0.67
Nodes (3): Hero background illustration (faint map/plane/clouds in light blue), Phone mockup showing itinerary route map UI, Steps illustration (location pin -> calendar icons, onboarding flow)

## Knowledge Gaps
- **529 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `css` (+524 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `New Trip & Command Dialog` to `Auth & Landing Pages`, `Package Dev Dependencies & Scripts`, `Trip Map, Server Entry & Error Capture`, `Inspire Feature`, `Menubar UI`, `Tripmates & Invites`, `Carousel UI`, `Chart UI`, `Context Menu UI`, `Email Template: Invite`, `Lovable Plan: Anthropic AI Migration`, `Itinerary View & Micro Animation`, `Email Template: Recovery`, `Email Template: Signup`, `Assistant Route & Chat`, `Input OTP UI`, `Empty State Wrapper UI`, `Email Queue Processor`, `Components.json Tailwind Config`, `Alert UI`, `Router & Start Instance`, `Terms Route`, `Avatar UI`, `Tabs UI`, `AI Gateway Server`, `ESLint Config`, `Stray onboarding.tsx`?**
  _High betweenness centrality (0.219) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Package Dependencies` to `Toggle UI`, `Router & Start Instance`, `Sidebar & App Shell UI`, `Public Explore & Share`?**
  _High betweenness centrality (0.134) - this node is a cross-community bridge._
- **Why does `sonner` connect `Toggle UI` to `Package Dependencies`?**
  _High betweenness centrality (0.071) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _530 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Package Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.028169014084507043 - nodes in this community are weakly interconnected._
- **Should `Auth & Landing Pages` be split into smaller, more focused modules?**
  _Cohesion score 0.052525252525252523 - nodes in this community are weakly interconnected._
- **Should `Stripe Payments & Subscriptions` be split into smaller, more focused modules?**
  _Cohesion score 0.05204872646733112 - nodes in this community are weakly interconnected._