{
  "brand": {
    "product_name": "Cyber Shield",
    "attributes": [
      "official",
      "authoritative",
      "forensic",
      "data-dense",
      "court-ready",
      "calm-under-pressure"
    ],
    "signature_element": {
      "name": "Ashoka Trace Line",
      "concept": "A subtle tri-band (saffron/white/green) micro-accent used ONLY as a 2–3px top border on key headers (Login card, Dashboard header, Report header) and as a thin divider line in PDFs. It grounds the product in Indian law-enforcement context without becoming decorative.",
      "implementation": "Use a 3px horizontal rule with 3 inline spans (1px each) or a single background with linear-gradient(90deg, saffron 0 33%, white 33% 66%, green 66% 100%) applied to a 3px-tall element. Keep total gradient area < 20% viewport (this is tiny)."
    }
  },

  "visual_style": {
    "direction": "Refined dark SOC console + government-grade restraint",
    "layout_principles": [
      "Left navigation + top command bar",
      "Dense, scannable cards and tables",
      "Monospace blocks for evidence artifacts",
      "Severity-first color semantics",
      "Markdown results rendered as structured briefs"
    ],
    "inspiration_refs": {
      "notes": "Use SOC/threat-intel dashboard patterns (incident feed, severity chips, dense panels) and government admin table patterns (sticky headers, filter chips, density controls).",
      "urls": [
        "https://dribbble.com/shots/27293347-Threat-Intelligence-Feed-UI",
        "https://dribbble.com/search/soc-dashboard",
        "https://designsystem.digital.gov/components/table/",
        "https://www.nngroup.com/articles/data-tables/"
      ]
    }
  },

  "typography": {
    "google_fonts": {
      "display": {
        "family": "Space Grotesk",
        "weights": [500, 600, 700]
      },
      "body": {
        "family": "IBM Plex Sans",
        "weights": [400, 500, 600]
      },
      "mono": {
        "family": "IBM Plex Mono",
        "weights": [400, 500, 600]
      },
      "import_instruction": "In /public/index.html add <link rel=\"preconnect\" href=\"https://fonts.googleapis.com\"> and the combined Google Fonts stylesheet for Space Grotesk + IBM Plex Sans + IBM Plex Mono. Then set CSS vars in index.css."
    },
    "scale_tailwind": {
      "h1": "text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight",
      "h2": "text-base md:text-lg font-medium text-muted-foreground",
      "section_title": "text-sm font-semibold tracking-wide uppercase",
      "body": "text-sm md:text-base",
      "small": "text-xs",
      "mono": "font-mono text-xs md:text-sm"
    },
    "usage": {
      "display": "Page titles, tool names, report headings",
      "body": "Forms, labels, table text, helper copy",
      "mono": "IPs, hashes, headers, routing hops, JSON, evidence IDs"
    }
  },

  "color_system": {
    "mode": "dark-first",
    "tokens_hex": {
      "bg": "#0B0F14",
      "surface": "#0F1620",
      "surface_2": "#121C28",
      "border": "#223042",
      "text": "#E7EEF7",
      "muted": "#9AA9BC",
      "primary": "#2DD4BF",
      "primary_2": "#38BDF8",
      "focus_ring": "#7DD3FC",
      "critical": "#F97316",
      "high": "#EF4444",
      "medium": "#F59E0B",
      "low": "#22C55E",
      "clean": "#10B981",
      "ashoka_saffron": "#F59E0B",
      "ashoka_white": "#E7EEF7",
      "ashoka_green": "#22C55E"
    },
    "semantic_mapping": {
      "background": "bg",
      "card": "surface",
      "card_alt": "surface_2",
      "stroke": "border",
      "text_primary": "text",
      "text_secondary": "muted",
      "action_primary": "primary",
      "action_secondary": "primary_2",
      "focus": "focus_ring",
      "risk": {
        "critical": "critical",
        "high": "high",
        "medium": "medium",
        "low": "low",
        "clean": "clean"
      }
    },
    "hsl_css_vars_instruction": "Replace the default shadcn :root/.dark HSL tokens in /src/index.css with a custom dark palette (keep shadcn variable names). Use bg as --background, text as --foreground, surface as --card, border as --border, primary as --primary, etc. Ensure contrast: body text >= 4.5:1.",
    "allowed_gradients": {
      "rule": "Gradients only as subtle section background accents; never on text-heavy panels; never exceed 20% viewport.",
      "hero_shell": "radial-gradient(900px circle at 20% 10%, rgba(45,212,191,0.10), transparent 55%), radial-gradient(700px circle at 80% 0%, rgba(56,189,248,0.10), transparent 50%)",
      "signature_line": "linear-gradient(90deg, #F59E0B 0 33%, #E7EEF7 33% 66%, #22C55E 66% 100%)"
    },
    "texture": {
      "noise_overlay": "Add a subtle CSS noise overlay (opacity 0.035–0.06) on the app shell only, not inside cards. Use a tiny base64 SVG noise or repeating-radial-gradient trick."
    }
  },

  "design_tokens_css": {
    "add_to_index_css": ":root {\n  --font-display: 'Space Grotesk', ui-sans-serif, system-ui;\n  --font-body: 'IBM Plex Sans', ui-sans-serif, system-ui;\n  --font-mono: 'IBM Plex Mono', ui-monospace, SFMono-Regular;\n\n  --cs-bg: #0B0F14;\n  --cs-surface: #0F1620;\n  --cs-surface-2: #121C28;\n  --cs-border: #223042;\n  --cs-text: #E7EEF7;\n  --cs-muted: #9AA9BC;\n  --cs-primary: #2DD4BF;\n  --cs-primary-2: #38BDF8;\n  --cs-focus: #7DD3FC;\n\n  --cs-risk-critical: #F97316;\n  --cs-risk-high: #EF4444;\n  --cs-risk-medium: #F59E0B;\n  --cs-risk-low: #22C55E;\n  --cs-risk-clean: #10B981;\n\n  --cs-radius-lg: 14px;\n  --cs-radius-md: 10px;\n  --cs-radius-sm: 8px;\n\n  --cs-shadow-1: 0 1px 0 rgba(255,255,255,0.04), 0 12px 30px rgba(0,0,0,0.45);\n  --cs-shadow-2: 0 0 0 1px rgba(125,211,252,0.18), 0 18px 50px rgba(0,0,0,0.55);\n\n  --cs-space-1: 4px;\n  --cs-space-2: 8px;\n  --cs-space-3: 12px;\n  --cs-space-4: 16px;\n  --cs-space-5: 24px;\n  --cs-space-6: 32px;\n}\n\nbody { font-family: var(--font-body); }\n\nh1,h2,h3,.font-display { font-family: var(--font-display); }\n\ncode, pre, kbd, .font-mono { font-family: var(--font-mono); }\n\n::selection { background: rgba(45,212,191,0.28); }\n\n/* App shell background accent (keep subtle) */\n.cs-shell {\n  background: radial-gradient(900px circle at 20% 10%, rgba(45,212,191,0.10), transparent 55%),\n              radial-gradient(700px circle at 80% 0%, rgba(56,189,248,0.10), transparent 50%),\n              var(--cs-bg);\n}\n\n/* Noise overlay */\n.cs-shell::before {\n  content: '';\n  position: fixed;\n  inset: 0;\n  pointer-events: none;\n  opacity: 0.045;\n  mix-blend-mode: overlay;\n  background-image: url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"120\" height=\"120\"><filter id=\"n\"><feTurbulence type=\"fractalNoise\" baseFrequency=\"0.9\" numOctaves=\"3\" stitchTiles=\"stitch\"/></filter><rect width=\"120\" height=\"120\" filter=\"url(%23n)\" opacity=\"0.35\"/></svg>');\n}\n",
    "tailwind_notes": "Prefer Tailwind utilities for layout; use these CSS vars for consistent feel. Avoid adding .App { text-align:center }."
  },

  "layout": {
    "grid": {
      "app_shell": "min-h-screen cs-shell",
      "desktop": "Sidebar (w-64) + main content (flex-1) with max-w-[1400px] content container and generous padding",
      "tablet": "Sidebar collapses into Sheet; top command bar remains",
      "spacing": "Use p-4 (mobile), md:p-6, lg:p-8; section gaps gap-6 lg:gap-8"
    },
    "navigation": {
      "sidebar": {
        "pattern": "Icon + label, grouped sections (Investigate, Cases, Admin)",
        "active_state": "Left 2px accent bar in primary + subtle bg tint",
        "footer": "Officer identity + station label + logout"
      },
      "top_bar": {
        "elements": [
          "Global search (history/cases)",
          "Quick actions: New Case, Paste Evidence",
          "Connection/AI status pill",
          "Profile menu"
        ]
      }
    },
    "pages": {
      "login": {
        "layout": "Centered card but content left-aligned; station seal placeholder + Ashoka Trace Line on top edge",
        "fields": ["Officer ID", "Password"],
        "secondary": "Authorized use notice + audit logging disclaimer"
      },
      "dashboard": {
        "above_fold": [
          "KPI strip (Today scans, High/Critical count, Cases updated, Avg response time)",
          "Recent activity feed (last 10 analyses)",
          "Quick-launch tiles for 5 tools",
          "Coming Soon banner (3 items)"
        ],
        "layout": "Bento grid: KPIs (4 small cards), Activity (wide), Tools (5 tiles), Coming soon (wide)"
      },
      "tool_workspace": {
        "layout": "Two-column on desktop: left input panel (40%), right results panel (60%). On mobile: stacked.",
        "left_panel": [
          "Case selector (Select)",
          "Evidence input (Textarea / Input)",
          "Options (Checkboxes/toggles)",
          "Analyze button + Save to case"
        ],
        "right_panel": [
          "Risk verdict header with chip + confidence",
          "Structured sections: Summary, Indicators, Attribution, Recommended Actions",
          "Technical details accordion (raw JSON, headers, hops)",
          "Copy buttons per block"
        ]
      },
      "history": {
        "layout": "Data table with sticky header; filter chips row; search input; density toggle; row actions",
        "columns": ["Timestamp", "Tool", "Target", "Risk", "Case", "Officer", "Actions"]
      },
      "case_report_detail": {
        "layout": "Report header + timeline of evidence + AI narrative + IT Act citations + export controls",
        "actions": ["Download PDF", "Copy FIR summary", "Add annexure"]
      }
    }
  },

  "components": {
    "component_path": {
      "shell": [
        "/app/frontend/src/components/ui/sheet.jsx",
        "/app/frontend/src/components/ui/navigation-menu.jsx",
        "/app/frontend/src/components/ui/separator.jsx",
        "/app/frontend/src/components/ui/scroll-area.jsx"
      ],
      "forms": [
        "/app/frontend/src/components/ui/form.jsx",
        "/app/frontend/src/components/ui/input.jsx",
        "/app/frontend/src/components/ui/textarea.jsx",
        "/app/frontend/src/components/ui/label.jsx",
        "/app/frontend/src/components/ui/select.jsx",
        "/app/frontend/src/components/ui/checkbox.jsx",
        "/app/frontend/src/components/ui/switch.jsx"
      ],
      "content": [
        "/app/frontend/src/components/ui/card.jsx",
        "/app/frontend/src/components/ui/badge.jsx",
        "/app/frontend/src/components/ui/tabs.jsx",
        "/app/frontend/src/components/ui/accordion.jsx",
        "/app/frontend/src/components/ui/table.jsx",
        "/app/frontend/src/components/ui/tooltip.jsx",
        "/app/frontend/src/components/ui/dialog.jsx",
        "/app/frontend/src/components/ui/alert.jsx"
      ],
      "feedback": [
        "/app/frontend/src/components/ui/progress.jsx",
        "/app/frontend/src/components/ui/skeleton.jsx",
        "/app/frontend/src/components/ui/sonner.jsx"
      ],
      "buttons": [
        "/app/frontend/src/components/ui/button.jsx",
        "/app/frontend/src/components/ui/dropdown-menu.jsx"
      ],
      "calendar_if_needed": [
        "/app/frontend/src/components/ui/calendar.jsx"
      ]
    },

    "component_specs": {
      "buttons": {
        "style": "Professional / Corporate with slight squircle",
        "tokens": {
          "radius": "var(--cs-radius-md)",
          "shadow": "var(--cs-shadow-1)",
          "press": "active:scale-[0.98]",
          "hover": "hover:bg-primary/90 (no transition:all)"
        },
        "variants": {
          "primary": "bg-[var(--cs-primary)] text-black hover:bg-[color-mix(in_srgb,var(--cs-primary),white 10%)] focus-visible:ring-2 focus-visible:ring-[var(--cs-focus)]",
          "secondary": "bg-transparent border border-[var(--cs-border)] text-[var(--cs-text)] hover:bg-white/5",
          "ghost": "bg-transparent text-[var(--cs-muted)] hover:text-[var(--cs-text)] hover:bg-white/5"
        },
        "transition_rule": "Use transition-colors and transition-shadow only; never transition-all."
      },

      "risk_chip": {
        "base": "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold border",
        "mapping": {
          "critical": "bg-[rgba(249,115,22,0.14)] text-[#FDBA74] border-[rgba(249,115,22,0.35)]",
          "high": "bg-[rgba(239,68,68,0.14)] text-[#FCA5A5] border-[rgba(239,68,68,0.35)]",
          "medium": "bg-[rgba(245,158,11,0.14)] text-[#FCD34D] border-[rgba(245,158,11,0.35)]",
          "low": "bg-[rgba(34,197,94,0.14)] text-[#86EFAC] border-[rgba(34,197,94,0.35)]",
          "clean": "bg-[rgba(16,185,129,0.14)] text-[#6EE7B7] border-[rgba(16,185,129,0.35)]"
        },
        "icon": "Use lucide-react: ShieldAlert, ShieldCheck, AlertTriangle, Siren, CircleCheck",
        "a11y": "Never rely on color alone: include label text (CRITICAL/HIGH/...) and icon."
      },

      "evidence_block": {
        "use": "For raw headers, hashes, IP lists",
        "classes": "rounded-[var(--cs-radius-sm)] border border-[var(--cs-border)] bg-black/30 p-3 font-mono text-xs leading-relaxed text-[var(--cs-text)] overflow-x-auto",
        "extras": "Add a top row with label + Copy button (Button ghost, size sm)."
      },

      "markdown_panel": {
        "library": "react-markdown + remark-gfm",
        "install": "npm i react-markdown remark-gfm",
        "render_rules": {
          "h2": "mt-6 mb-2 text-sm font-semibold tracking-wide uppercase text-[var(--cs-muted)]",
          "ul": "my-2 list-disc pl-5 space-y-1",
          "strong": "text-[var(--cs-text)] font-semibold",
          "code_inline": "rounded bg-white/5 px-1.5 py-0.5 font-mono text-[0.85em]",
          "pre": "mt-3 mb-4 rounded-[var(--cs-radius-sm)] border border-[var(--cs-border)] bg-black/35 p-3 overflow-x-auto"
        }
      },

      "tables_history": {
        "pattern": "Sticky header + row hover + row actions",
        "classes": {
          "table_wrap": "rounded-[var(--cs-radius-lg)] border border-[var(--cs-border)] bg-[var(--cs-surface)] shadow-[var(--cs-shadow-1)]",
          "thead": "sticky top-0 bg-[var(--cs-surface)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--cs-surface)]/75",
          "row": "hover:bg-white/3",
          "cell_mono": "font-mono text-xs text-[var(--cs-muted)]"
        },
        "density_toggle": "Use ToggleGroup (compact/comfortable) to switch py-2 vs py-3 row padding."
      },

      "loading_scanning": {
        "pattern": "Confident scanning state",
        "components": ["progress", "skeleton", "sonner"],
        "behavior": [
          "Disable Analyze button while running",
          "Show inline Progress with label 'Scanning with secure AI…'",
          "Animate only opacity/width; respect prefers-reduced-motion"
        ]
      }
    }
  },

  "motion": {
    "library": {
      "optional": "framer-motion",
      "install": "npm i framer-motion",
      "use_cases": [
        "Tool result panel entrance (fade + slight y)",
        "Risk chip pulse on new result (subtle)",
        "Sidebar collapse/expand"
      ],
      "reduced_motion": "Wrap animations with prefers-reduced-motion checks; provide non-animated fallback."
    },
    "micro_interactions": [
      "Buttons: transition-colors duration-150; active scale 0.98",
      "Cards: hover border tint + subtle shadow increase",
      "Copy-to-clipboard: show Sonner toast 'Copied to clipboard'",
      "Table rows: hover highlight + reveal row actions"
    ]
  },

  "accessibility": {
    "requirements": [
      "WCAG AA contrast for text",
      "Visible focus ring (2px) using --cs-focus",
      "Keyboard navigable sidebar + tables",
      "Use aria-labels for icon-only buttons",
      "Respect prefers-reduced-motion"
    ],
    "content": {
      "authorized_use_notice": "Show a persistent small notice in Login and Settings: 'Authorized use only. All actions are logged.'"
    }
  },

  "testing": {
    "data_testid_rules": {
      "must_apply_to": [
        "All buttons",
        "All links",
        "All form inputs/selects/textareas",
        "All menus and menu items",
        "All key informational outputs (risk verdict, threat level, report id, error banners)"
      ],
      "convention": "kebab-case describing role (not appearance)",
      "examples": [
        "data-testid=\"login-submit-button\"",
        "data-testid=\"dashboard-quick-launch-ip-intel\"",
        "data-testid=\"tool-analyze-button\"",
        "data-testid=\"risk-verdict-chip\"",
        "data-testid=\"history-search-input\"",
        "data-testid=\"report-download-pdf-button\""
      ]
    }
  },

  "image_urls": {
    "login_header_background": {
      "category": "login",
      "description": "Optional subtle header image in the login card header (use very low opacity, grayscale).",
      "urls": [
        "https://images.unsplash.com/photo-1582470051980-5efb2f9b4c69?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2Mzl8MHwxfHNlYXJjaHwyfHxpbmRpYSUyMGdvdmVybm1lbnQlMjBidWlsZGluZyUyMG5pZ2h0fGVufDB8fHxibGFja3wxNzgxNDU2Nzg5fDA&ixlib=rb-4.1.0&q=85"
      ]
    },
    "dashboard_hero_optional": {
      "category": "dashboard",
      "description": "Optional wide banner image behind the Coming Soon section (blurred, darkened).",
      "urls": [
        "https://images.unsplash.com/photo-1697127997429-4155a247fece?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2Mzl8MHwxfHNlYXJjaHwxfHxpbmRpYSUyMGdvdmVybm1lbnQlMjBidWlsZGluZyUyMG5pZ2h0fGVufDB8fHxibGFja3wxNzgxNDU2Nzg5fDA&ixlib=rb-4.1.0&q=85"
      ]
    }
  },

  "instructions_to_main_agent": [
    "Remove CRA default App.css centering patterns; do not use .App-header layout. Use Tailwind layout + cs-shell class on the root container.",
    "Switch to dark-first theme by setting <html class=\"dark\"> or toggling .dark on body/root; then replace shadcn HSL tokens in index.css to match the provided palette.",
    "Implement the app shell: Sidebar + TopBar + main content container. Sidebar collapses to Sheet on tablet.",
    "For each tool workspace, implement a two-panel layout with a persistent Analyze button and a results panel that renders markdown via react-markdown + remark-gfm.",
    "Implement RiskChip component using Badge with the mapping above; include icon + label; add data-testid on chip and verdict text.",
    "Use EvidenceBlock component for raw technical artifacts with Copy button and Sonner toast.",
    "History page must use shadcn Table with sticky header, filter chips row, search input, and row actions (view/delete).",
    "Case Report detail must include Download PDF button and a print/PDF-friendly layout; include Ashoka Trace Line in report header.",
    "All interactive and key informational elements must include data-testid attributes (kebab-case)."
  ]
}

<General UI UX Design Guidelines>  
    - You must **not** apply universal transition. Eg: `transition: all`. This results in breaking transforms. Always add transitions for specific interactive elements like button, input excluding transforms
    - You must **not** center align the app container, ie do not add `.App { text-align: center; }` in the css file. This disrupts the human natural reading flow of text
   - NEVER: use AI assistant Emoji characters like`🤖🧠💭💡🔮🎯📚🎭🎬🎪🎉🎊🎁🎀🎂🍰🎈🎨🎰💰💵💳🏦💎🪙💸🤑📊📈📉💹🔢🏆🥇 etc for icons. Always use **FontAwesome cdn** or **lucid-react** library already installed in the package.json

 **GRADIENT RESTRICTION RULE**
NEVER use dark/saturated gradient combos (e.g., purple/pink) on any UI element.  Prohibited gradients: blue-500 to purple 600, purple 500 to pink-500, green-500 to blue-500, red to pink etc
NEVER use dark gradients for logo, testimonial, footer etc
NEVER let gradients cover more than 20% of the viewport.
NEVER apply gradients to text-heavy content or reading areas.
NEVER use gradients on small UI elements (<100px width).
NEVER stack multiple gradient layers in the same viewport.

**ENFORCEMENT RULE:**
    • Id gradient area exceeds 20% of viewport OR affects readability, **THEN** use solid colors

**How and where to use:**
   • Section backgrounds (not content backgrounds)
   • Hero section header content. Eg: dark to light to dark color
   • Decorative overlays and accent elements only
   • Hero section with 2-3 mild color
   • Gradients creation can be done for any angle say horizontal, vertical or diagonal

- For AI chat, voice application, **do not use purple color. Use color like light green, ocean blue, peach orange etc**

</Font Guidelines>

- Every interaction needs micro-animations - hover states, transitions, parallax effects, and entrance animations. Static = dead. 
   
- Use 2-3x more spacing than feels comfortable. Cramped designs look cheap.

- Subtle grain textures, noise overlays, custom cursors, selection states, and loading animations: separates good from extraordinary.
   
- Before generating UI, infer the visual style from the problem statement (palette, contrast, mood, motion) and immediately instantiate it by setting global design tokens (primary, secondary/accent, background, foreground, ring, state colors), rather than relying on any library defaults. Don't make the background dark as a default step, always understand problem first and define colors accordingly
    Eg: - if it implies playful/energetic, choose a colorful scheme
           - if it implies monochrome/minimal, choose a black–white/neutral scheme

**Component Reuse:**
	- Prioritize using pre-existing components from src/components/ui when applicable
	- Create new components that match the style and conventions of existing components when needed
	- Examine existing components to understand the project's component patterns before creating new ones

**IMPORTANT**: Do not use HTML based component like dropdown, calendar, toast etc. You **MUST** always use `/app/frontend/src/components/ui/ ` only as a primary components as these are modern and stylish component

**Best Practices:**
	- Use Shadcn/UI as the primary component library for consistency and accessibility
	- Import path: ./components/[component-name]

**Export Conventions:**
	- Components MUST use named exports (export const ComponentName = ...)
	- Pages MUST use default exports (export default function PageName() {...})

**Toasts:**
  - Use `sonner` for toasts"
  - Sonner component are located in `/app/src/components/ui/sonner.tsx`

Use 2–4 color gradients, subtle textures/noise overlays, or CSS-based noise to avoid flat visuals.
</General UI UX Design Guidelines>
