# Graph Report - .  (2026-06-30)

## Corpus Check
- 202 files · ~96,240 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1028 nodes · 1554 edges · 79 communities (71 shown, 8 thin omitted)
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
- [[_COMMUNITY_Onboarding & Destination Picker|Onboarding & Destination Picker]]
- [[_COMMUNITY_Trip Map, Server Entry & Error Capture|Trip Map, Server Entry & Error Capture]]
- [[_COMMUNITY_Form Inputs & Utils|Form Inputs & Utils]]
- [[_COMMUNITY_Dashboard|Dashboard]]
- [[_COMMUNITY_New Trip & Command Dialog|New Trip & Command Dialog]]
- [[_COMMUNITY_Lovable Plan Branding & Routing Notes|Lovable Plan: Branding & Routing Notes]]
- [[_COMMUNITY_Trip Card, Drawer & Skeleton UI|Trip Card, Drawer & Skeleton UI]]
- [[_COMMUNITY_TypeScript Config|TypeScript Config]]
- [[_COMMUNITY_Inspire Feature|Inspire Feature]]
- [[_COMMUNITY_Menubar UI|Menubar UI]]
- [[_COMMUNITY_Brand Logo, Copilot & Checkout Return|Brand Logo, Copilot & Checkout Return]]
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

## God Nodes (most connected - your core abstractions)
1. `cn()` - 82 edges
2. `FileRoutesByPath` - 30 edges
3. `supabase` - 27 edges
4. `useAuthModal()` - 19 edges
5. `compilerOptions` - 17 edges
6. `fetch()` - 10 edges
7. `BrandLogo()` - 9 edges
8. `requireSupabaseAuth` - 8 edges
9. `scripts` - 7 edges
10. `LanguageSwitcher()` - 7 edges

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

## Hyperedges (group relationships)
- **Itineraya implementation plan priority fixes** — lovable_plan_privacy_bug_mis_viajes, lovable_plan_migrar_ia_anthropic, lovable_plan_logo_clicable_home, lovable_plan_mobile_bottom_bar_visibility, lovable_plan_verificar_boton_empieza_gratis [EXTRACTED 1.00]
- **Itineraya brand mark visual assets** — public_itineraya_mark_brand_icon, public_favicon_itineraya_mark_icon, src_assets_itineraya_mark_svg, public_itineraya_logo_wordmark, public_og_image_social_share [INFERRED 0.85]
- **Global header/navigation components (logo + back button)** — lovable_plan_authenticated_route_tsx, lovable_plan_brandlogo_component, lovable_plan_navbar_component, lovable_plan_flecha_retroceso_global, lovable_plan_logo_clicable_home [EXTRACTED 1.00]

## Communities (79 total, 8 thin omitted)

### Community 0 - "Package Dependencies"
Cohesion: 0.03
Nodes (71): dependencies, ai, @ai-sdk/anthropic, @ai-sdk/openai-compatible, @ai-sdk/react, class-variance-authority, clsx, cmdk (+63 more)

### Community 1 - "Auth & Landing Pages"
Cohesion: 0.06
Nodes (44): AuthModalContext, AuthModalContextValue, OpenOptions, useAuthModal(), AuthModal(), AuthModalMode, Props, MOBILE_NAV_ITEMS (+36 more)

### Community 2 - "Stripe Payments & Subscriptions"
Cohesion: 0.07
Nodes (39): stripe, DashboardSidebar(), PaymentTestModeBanner(), Props, StripeEmbeddedCheckout(), CheckoutOptions, useStripeCheckout(), isActiveStatus() (+31 more)

### Community 3 - "Sidebar & App Shell UI"
Cohesion: 0.05
Nodes (38): Input, Separator, SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay (+30 more)

### Community 4 - "Public Explore & Share"
Cohesion: 0.07
Nodes (23): requireSupabaseAuth, supabaseAdmin, CompositeTypes, Constants, Database, DatabaseWithoutInternals, DefaultSchema, Enums (+15 more)

### Community 5 - "Generated Route Tree"
Cohesion: 0.06
Nodes (35): ApiChatRoute, ApiPublicPaymentsWebhookRoute, AuthenticatedAssistantRoute, AuthenticatedCopilotRoute, AuthenticatedDashboardRoute, AuthenticatedInspireRoute, AuthenticatedNewTripRoute, AuthenticatedOnboardingRoute (+27 more)

### Community 6 - "i18n, Cookies & Error Providers"
Cohesion: 0.09
Nodes (20): AuthModalProvider(), AuthModalRouteSync(), CookieBanner(), Prefs, applyLang(), LanguageProvider(), readInitialLang(), setAppLanguage() (+12 more)

### Community 7 - "Package Dev Dependencies & Scripts"
Cohesion: 0.06
Nodes (31): devDependencies, eslint, eslint-config-prettier, @eslint/js, eslint-plugin-prettier, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals (+23 more)

### Community 8 - "Onboarding & Destination Picker"
Cohesion: 0.08
Nodes (17): DateRangeField(), DestinationAutocomplete(), Props, Suggestion, Window, HotelMapPicker(), HotelSelection, NominatimResult (+9 more)

### Community 9 - "Trip Map, Server Entry & Error Capture"
Cohesion: 0.10
Nodes (17): nominatimReverse(), nominatimSearch(), Activity, Day, DAY_COLORS, Geo, geocode(), Pin (+9 more)

### Community 10 - "Form Inputs & Utils"
Cohesion: 0.09
Nodes (12): Props, Checkbox, HoverCardContent, PopoverContent, Progress, RadioGroup, RadioGroupItem, ScrollArea (+4 more)

### Community 11 - "Dashboard"
Cohesion: 0.13
Nodes (17): Props, ShareDialog(), AUTUMN, fetchWeather(), getSeasonalInspirations(), Inspiration, SPRING, SUMMER (+9 more)

### Community 12 - "New Trip & Command Dialog"
Cohesion: 0.12
Nodes (15): Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut() (+7 more)

### Community 13 - "Lovable Plan: Branding & Routing Notes"
Cohesion: 0.11
Nodes (20): /auth?mode=signup route, src/routes/_authenticated/route.tsx, BrandLogo component, DashboardSidebar.tsx, Flecha de retroceso global (ArrowLeft back button), HeroSection.tsx (line 109-116), Logo clicable a la home en todas las pantallas, Mostrar barra inferior móvil en pantallas autenticadas excepto indicadas (+12 more)

### Community 14 - "Trip Card, Drawer & Skeleton UI"
Cohesion: 0.15
Nodes (15): TripCard(), TripCardTrip, DrawerContent, DrawerDescription, DrawerFooter(), DrawerHeader(), DrawerOverlay, DrawerTitle (+7 more)

### Community 15 - "TypeScript Config"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, jsx, lib, module, moduleResolution, noEmit, noFallthroughCasesInSwitch (+11 more)

### Community 16 - "Inspire Feature"
Cohesion: 0.15
Nodes (12): fallbackImage(), Input, suggestDestinations, SuggestedDestination, unsplashImage(), INSPIRE_QUESTIONS, InspireAnswers, InspireOption (+4 more)

### Community 17 - "Menubar UI"
Cohesion: 0.12
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 18 - "Brand Logo, Copilot & Checkout Return"
Cohesion: 0.15
Nodes (6): BrandLogo(), HEIGHTS, Size, Variant, Route, Route

### Community 19 - "Button, Calendar & Pagination UI"
Cohesion: 0.17
Nodes (13): Button, ButtonProps, buttonVariants, Calendar(), CalendarDayButton(), Pagination(), PaginationContent, PaginationEllipsis() (+5 more)

### Community 20 - "Tripmates & Invites"
Cohesion: 0.16
Nodes (10): Invite, Member, TripmatesModal(), AcceptInput, acceptInvite, InviteInput, inviteTripmate, ListInput (+2 more)

### Community 21 - "Form & Label UI"
Cohesion: 0.14
Nodes (11): FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext, FormItemContextValue, FormLabel (+3 more)

### Community 22 - "Google Trip Map"
Cohesion: 0.14
Nodes (7): Activity, CATEGORY_COLORS, Day, Geo, Pin, Props, Window

### Community 23 - "Carousel UI"
Cohesion: 0.14
Nodes (12): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+4 more)

### Community 24 - "Trip Itinerary Route"
Cohesion: 0.16
Nodes (10): Activity, ActivityCategory, ActivityRow(), bookingForCategory(), BookingInfo, Day, googleMapsUrl(), Itinerary (+2 more)

### Community 25 - "Misc Route Tree Entries"
Cohesion: 0.15
Nodes (11): ChatRequestBody, Route, Route, Route, Route, Route, Route, Route (+3 more)

### Community 26 - "Chart UI"
Cohesion: 0.18
Nodes (7): ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartTooltipContent, THEMES

### Community 27 - "Assistant Edit Panel"
Cohesion: 0.22
Nodes (7): AssistantEditPanel(), Message, Activity, Day, editItineraryWithAssistant, Input, Itinerary

### Community 28 - "Context Menu UI"
Cohesion: 0.20
Nodes (9): ContextMenuCheckboxItem, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuRadioItem, ContextMenuSeparator, ContextMenuShortcut(), ContextMenuSubContent (+1 more)

### Community 29 - "Dropdown Menu UI"
Cohesion: 0.20
Nodes (9): DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut(), DropdownMenuSubContent (+1 more)

### Community 30 - "Email Template: Email Change"
Cohesion: 0.20
Nodes (9): button, container, EmailChangeEmail(), EmailChangeEmailProps, footer, h1, link, main (+1 more)

### Community 31 - "Email Template: Invite"
Cohesion: 0.20
Nodes (9): button, container, footer, h1, InviteEmail(), InviteEmailProps, link, main (+1 more)

### Community 32 - "Postcard Generator"
Cohesion: 0.31
Nodes (9): generatePostcardDataUrl(), hashCode(), hexToRgba(), loadImage(), PALETTES, PostcardActivity, PostcardInput, roundRect() (+1 more)

### Community 33 - "Lovable Plan: Anthropic AI Migration"
Cohesion: 0.28
Nodes (9): @ai-sdk/anthropic dependency, src/lib/anthropic.server.ts (planned helper), generateJSON({ system, prompt, schema }), src/lib/inspire.functions.ts, src/lib/itinerary-edit.functions.ts, src/lib/itinerary.functions.ts, Lovable AI gateway (Gemini), Migrar IA a Anthropic Claude Haiku 4.5 (+1 more)

### Community 34 - "Itinerary View & Micro Animation"
Cohesion: 0.28
Nodes (7): Activity, Day, daySelectorVariants, ItineraryView(), ItineraryViewProps, mockItineraryData, useMicroAnimation()

### Community 35 - "Alert Dialog UI"
Cohesion: 0.22
Nodes (8): AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter(), AlertDialogHeader(), AlertDialogOverlay, AlertDialogTitle

### Community 36 - "Table UI"
Cohesion: 0.22
Nodes (8): Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow

### Community 37 - "Email Template: Magic Link"
Cohesion: 0.22
Nodes (8): button, container, footer, h1, MagicLinkEmail(), MagicLinkEmailProps, main, text

### Community 38 - "Email Template: Reauthentication"
Cohesion: 0.22
Nodes (8): codeStyle, container, footer, h1, main, ReauthenticationEmail(), ReauthenticationEmailProps, text

### Community 39 - "Email Template: Recovery"
Cohesion: 0.22
Nodes (8): button, container, footer, h1, main, RecoveryEmail(), RecoveryEmailProps, text

### Community 40 - "Email Template: Signup"
Cohesion: 0.22
Nodes (8): button, container, footer, h1, link, main, SignupEmailProps, text

### Community 41 - "Assistant Route & Chat"
Cohesion: 0.22
Nodes (3): Plan, Route, Trip

### Community 42 - "Components.json Schema"
Cohesion: 0.25
Nodes (7): iconLibrary, registries, rsc, rtl, $schema, style, tsx

### Community 43 - "Publish Toggle & Toasts"
Cohesion: 0.29
Nodes (6): sonner, Props, PublishToggle(), Toaster(), ToasterProps, setTripPublic

### Community 44 - "Breadcrumb UI"
Cohesion: 0.25
Nodes (7): Breadcrumb, BreadcrumbEllipsis(), BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator()

### Community 45 - "Navigation Menu UI"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 46 - "Select UI"
Cohesion: 0.25
Nodes (7): SelectContent, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator, SelectTrigger

### Community 47 - "Card UI"
Cohesion: 0.29
Nodes (6): Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle

### Community 48 - "Toggle UI"
Cohesion: 0.33
Nodes (5): ToggleGroup, ToggleGroupContext, ToggleGroupItem, Toggle, toggleVariants

### Community 49 - "Components.json Aliases"
Cohesion: 0.33
Nodes (6): aliases, components, hooks, lib, ui, utils

### Community 50 - "Input OTP UI"
Cohesion: 0.40
Nodes (5): input-otp, InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot

### Community 51 - "Empty State Wrapper UI"
Cohesion: 0.33
Nodes (4): defaultIconPaths, EmptyStateWrapper(), EmptyStateWrapperProps, ParticleProps

### Community 53 - "Components.json Tailwind Config"
Cohesion: 0.40
Nodes (5): tailwind, baseColor, css, cssVariables, prefix

### Community 54 - "Alert UI"
Cohesion: 0.40
Nodes (4): Alert, AlertDescription, AlertTitle, alertVariants

### Community 55 - "Email Auth Preview Route"
Cohesion: 0.40
Nodes (4): SignupEmail(), EMAIL_TEMPLATES, Route, SAMPLE_DATA

### Community 56 - "Itinerary Generation Functions"
Cohesion: 0.50
Nodes (4): fallbackImage(), generateItinerary, Input, unsplashImage()

### Community 57 - "Router & Start Instance"
Cohesion: 0.40
Nodes (4): getRouter(), Register, routeTree, startInstance

### Community 58 - "Email Auth Webhook"
Cohesion: 0.40
Nodes (3): EMAIL_SUBJECTS, EMAIL_TEMPLATES, Route

### Community 61 - "Lovable Plan: Privacy/RLS Bug Fix"
Cohesion: 0.50
Nodes (4): src/routes/_authenticated/dashboard.tsx trips query (line 86-89), Bug crítico de privacidad en "Mis viajes", saved_inspirations and other dashboard/profile queries audit, trips RLS policies

### Community 62 - "Accordion UI"
Cohesion: 0.50
Nodes (3): AccordionContent, AccordionItem, AccordionTrigger

### Community 63 - "Avatar UI"
Cohesion: 0.50
Nodes (3): Avatar, AvatarFallback, AvatarImage

### Community 64 - "Badge UI"
Cohesion: 0.67
Nodes (3): Badge(), BadgeProps, badgeVariants

### Community 65 - "Tabs UI"
Cohesion: 0.50
Nodes (3): TabsContent, TabsList, TabsTrigger

### Community 68 - "Onboarding & Hero Images"
Cohesion: 0.67
Nodes (3): Hero background illustration (faint map/plane/clouds in light blue), Phone mockup showing itinerary route map UI, Steps illustration (location pin -> calendar icons, onboarding flow)

## Knowledge Gaps
- **527 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `css` (+522 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `Package Dependencies` to `Stripe Payments & Subscriptions`, `Input OTP UI`, `Publish Toggle & Toasts`, `Package Dev Dependencies & Scripts`?**
  _High betweenness centrality (0.214) - this node is a cross-community bridge._
- **Why does `cn()` connect `Trip Card, Drawer & Skeleton UI` to `Sidebar & App Shell UI`, `Onboarding & Destination Picker`, `Form Inputs & Utils`, `New Trip & Command Dialog`, `Inspire Feature`, `Menubar UI`, `Button, Calendar & Pagination UI`, `Form & Label UI`, `Carousel UI`, `Chart UI`, `Context Menu UI`, `Dropdown Menu UI`, `Itinerary View & Micro Animation`, `Alert Dialog UI`, `Table UI`, `Breadcrumb UI`, `Navigation Menu UI`, `Select UI`, `Card UI`, `Toggle UI`, `Input OTP UI`, `Empty State Wrapper UI`, `Alert UI`, `Accordion UI`, `Avatar UI`, `Badge UI`, `Tabs UI`?**
  _High betweenness centrality (0.194) - this node is a cross-community bridge._
- **Why does `sonner` connect `Publish Toggle & Toasts` to `Package Dependencies`?**
  _High betweenness centrality (0.109) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _528 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Package Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.028169014084507043 - nodes in this community are weakly interconnected._
- **Should `Auth & Landing Pages` be split into smaller, more focused modules?**
  _Cohesion score 0.05839727195225917 - nodes in this community are weakly interconnected._
- **Should `Stripe Payments & Subscriptions` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._