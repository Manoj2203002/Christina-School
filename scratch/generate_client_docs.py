import os
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, hex_color):
    """Set the background color of a table cell."""
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=140, bottom=140, left=180, right=180):
    """Set cell padding in dxa (1 pt = 20 dxa)."""
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(
        f'<w:tcMar {nsdecls("w")}>'
        f'  <w:top w:w="{top}" w:type="dxa"/>'
        f'  <w:bottom w:w="{bottom}" w:type="dxa"/>'
        f'  <w:left w:w="{left}" w:type="dxa"/>'
        f'  <w:right w:w="{right}" w:type="dxa"/>'
        f'</w:tcMar>'
    )
    tcPr.append(tcMar)

def set_cell_borders(cell, top="CBD5E1", bottom="CBD5E1", left="CBD5E1", right="CBD5E1", sz="4", val="single"):
    """Set custom cell borders."""
    tcPr = cell._tc.get_or_add_tcPr()
    tcBorders = parse_xml(
        f'<w:tcBorders {nsdecls("w")}>'
        f'  <w:top w:val="{val}" w:sz="{sz}" w:space="0" w:color="{top}"/>'
        f'  <w:left w:val="{val}" w:sz="{sz}" w:space="0" w:color="{left}"/>'
        f'  <w:bottom w:val="{val}" w:sz="{sz}" w:space="0" w:color="{bottom}"/>'
        f'  <w:right w:val="{val}" w:sz="{sz}" w:space="0" w:color="{right}"/>'
        f'</w:tcBorders>'
    )
    tcPr.append(tcBorders)

def add_callout_box(doc, title, text, bg_hex="EFF6FF", border_hex="3B82F6"):
    """Add a stylized callout information box."""
    table = doc.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    
    cell = table.cell(0, 0)
    cell.width = Inches(6.5)
    set_cell_background(cell, bg_hex)
    set_cell_margins(cell, top=160, bottom=160, left=240, right=200)
    
    tcPr = cell._tc.get_or_add_tcPr()
    borders = parse_xml(
        f'<w:tcBorders {nsdecls("w")}>'
        f'  <w:left w:val="single" w:sz="24" w:space="0" w:color="{border_hex}"/>'
        f'  <w:top w:val="none"/>'
        f'  <w:bottom w:val="none"/>'
        f'  <w:right w:val="none"/>'
        f'</w:tcBorders>'
    )
    tcPr.append(borders)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(4)
    run_title = p.add_run(title)
    run_title.bold = True
    run_title.font.name = "Calibri"
    run_title.font.size = Pt(11)
    run_title.font.color.rgb = RGBColor(15, 23, 42)
    
    p2 = cell.add_paragraph()
    p2.paragraph_format.space_before = Pt(0)
    p2.paragraph_format.space_after = Pt(2)
    run_text = p2.add_run(text)
    run_text.font.name = "Calibri"
    run_text.font.size = Pt(10)
    run_text.font.color.rgb = RGBColor(51, 65, 85)
    
    doc.add_paragraph().paragraph_format.space_after = Pt(6)

def add_image_placeholder(doc, title, description, height_in_inches=2.2):
    """Add a dedicated, styled image placeholder frame with gap for user screenshots."""
    table = doc.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    
    cell = table.cell(0, 0)
    cell.width = Inches(6.5)
    set_cell_background(cell, "F8FAFC")
    set_cell_margins(cell, top=200, bottom=200, left=240, right=240)
    set_cell_borders(cell, top="94A3B8", bottom="94A3B8", left="94A3B8", right="94A3B8", sz="8", val="dashed")
    
    p = cell.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(8)
    p.paragraph_format.space_after = Pt(2)
    
    r_cam = p.add_run("📷  IMAGE PLACEHOLDER: ")
    r_cam.bold = True
    r_cam.font.name = "Calibri"
    r_cam.font.size = Pt(10.5)
    r_cam.font.color.rgb = RGBColor(30, 41, 59)
    
    r_title = p.add_run(title)
    r_title.bold = True
    r_title.font.name = "Calibri"
    r_title.font.size = Pt(10.5)
    r_title.font.color.rgb = RGBColor(29, 78, 216)
    
    p_desc = cell.add_paragraph()
    p_desc.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_desc.paragraph_format.space_before = Pt(0)
    p_desc.paragraph_format.space_after = Pt(12)
    r_desc = p_desc.add_run(f"({description} — Paste or insert screenshot in the blank area below)")
    r_desc.italic = True
    r_desc.font.name = "Calibri"
    r_desc.font.size = Pt(9.5)
    r_desc.font.color.rgb = RGBColor(100, 116, 139)
    
    # Visual vertical gap for inserting image
    gap_lines = max(2, int(height_in_inches * 2))
    for _ in range(gap_lines):
        p_gap = cell.add_paragraph()
        p_gap.paragraph_format.space_before = Pt(0)
        p_gap.paragraph_format.space_after = Pt(14)
    
    doc.add_paragraph().paragraph_format.space_after = Pt(8)

def format_run(run, font_name="Calibri", size_pt=10.5, color_rgb=RGBColor(30, 41, 59), bold=False, italic=False):
    run.font.name = font_name
    run.font.size = Pt(size_pt)
    run.font.color.rgb = color_rgb
    run.bold = bold
    run.italic = italic

def add_heading_1(doc, text):
    h = doc.add_paragraph()
    h.paragraph_format.space_before = Pt(18)
    h.paragraph_format.space_after = Pt(6)
    h.paragraph_format.keep_with_next = True
    r = h.add_run(text)
    format_run(r, font_name="Calibri", size_pt=16, color_rgb=RGBColor(10, 27, 61), bold=True)
    return h

def add_heading_2(doc, text):
    h = doc.add_paragraph()
    h.paragraph_format.space_before = Pt(14)
    h.paragraph_format.space_after = Pt(4)
    h.paragraph_format.keep_with_next = True
    r = h.add_run(text)
    format_run(r, font_name="Calibri", size_pt=13, color_rgb=RGBColor(29, 78, 216), bold=True)
    return h

def add_heading_3(doc, text):
    h = doc.add_paragraph()
    h.paragraph_format.space_before = Pt(10)
    h.paragraph_format.space_after = Pt(3)
    h.paragraph_format.keep_with_next = True
    r = h.add_run(text)
    format_run(r, font_name="Calibri", size_pt=11.5, color_rgb=RGBColor(15, 23, 42), bold=True)
    return h

def add_body_p(doc, text, space_after=6):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.line_spacing = 1.15
    r = p.add_run(text)
    format_run(r, font_name="Calibri", size_pt=10.5, color_rgb=RGBColor(30, 41, 59))
    return p

def add_bullet(doc, title, text):
    p = doc.add_paragraph(style='List Bullet')
    p.paragraph_format.space_before = Pt(1)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.line_spacing = 1.15
    r_b = p.add_run(title + ": ")
    format_run(r_b, font_name="Calibri", size_pt=10, color_rgb=RGBColor(10, 27, 61), bold=True)
    r_t = p.add_run(text)
    format_run(r_t, font_name="Calibri", size_pt=10, color_rgb=RGBColor(51, 65, 85))
    return p

def build_client_documentation():
    doc = Document()
    
    # Configure 0.75" margins for clean layout
    for s in doc.sections:
        s.top_margin = Inches(0.8)
        s.bottom_margin = Inches(0.8)
        s.left_margin = Inches(0.8)
        s.right_margin = Inches(0.8)
        s.page_width = Inches(8.5)
        s.page_height = Inches(11.0)
    
    # ---------------------------------------------------------------------------
    # DOCUMENT COVER & HEADER TITLE
    # ---------------------------------------------------------------------------
    p_pre = doc.add_paragraph()
    p_pre.paragraph_format.space_before = Pt(10)
    p_pre.paragraph_format.space_after = Pt(2)
    r_pre = p_pre.add_run("CLIENT DELIVERABLE & ARCHITECTURE BLUEPRINT")
    format_run(r_pre, font_name="Calibri", size_pt=10, color_rgb=RGBColor(255, 122, 26), bold=True)
    
    p_title = doc.add_paragraph()
    p_title.paragraph_format.space_before = Pt(2)
    p_title.paragraph_format.space_after = Pt(4)
    r_title = p_title.add_run("Christina Nursery & Primary School")
    format_run(r_title, font_name="Calibri", size_pt=26, color_rgb=RGBColor(10, 27, 61), bold=True)
    
    p_sub = doc.add_paragraph()
    p_sub.paragraph_format.space_before = Pt(0)
    p_sub.paragraph_format.space_after = Pt(14)
    r_sub = p_sub.add_run("Complete UI/UX Prototype Reference & Enterprise Application Specification\n(Target Production Stack: Angular 18+ & ASP.NET Core 8 Web API)")
    format_run(r_sub, font_name="Calibri", size_pt=12.5, color_rgb=RGBColor(29, 78, 216), italic=True)
    
    # Metadata summary table
    meta_table = doc.add_table(rows=5, cols=2)
    meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_table.autofit = False
    
    metadata = [
        ("Project Name", "Christina Nursery and Primary School Web Platform"),
        ("Document Purpose", "UI/UX Benchmark, Functional Specification & Full Architecture Reference"),
        ("Current Artifact", "Fully Functional, High-Fidelity SPA Prototype (HTML5/CSS3/Modular JS)"),
        ("Target Production Architecture", "Frontend: Angular 18+ (Standalone Components, Signals, Reactive Forms)\nBackend: ASP.NET Core (.NET 8/9 Web API, Entity Framework Core, SQL Server)"),
        ("Target Stakeholders", "School Leadership, Board of Trustees, Admissions Office, Engineering Team")
    ]
    
    col_widths = [Inches(2.2), Inches(4.3)]
    for i, (k, v) in enumerate(metadata):
        row = meta_table.rows[i]
        c0, c1 = row.cells[0], row.cells[1]
        c0.width, c1.width = col_widths[0], col_widths[1]
        
        set_cell_background(c0, "F1F5F9")
        set_cell_background(c1, "FFFFFF")
        set_cell_margins(c0, top=100, bottom=100, left=140, right=140)
        set_cell_margins(c1, top=100, bottom=100, left=140, right=140)
        set_cell_borders(c0, top="CBD5E1", bottom="CBD5E1", left="CBD5E1", right="CBD5E1")
        set_cell_borders(c1, top="CBD5E1", bottom="CBD5E1", left="CBD5E1", right="CBD5E1")
        
        p0 = c0.paragraphs[0]
        p0.paragraph_format.space_after = Pt(2)
        r0 = p0.add_run(k)
        format_run(r0, font_name="Calibri", size_pt=9.5, color_rgb=RGBColor(15, 23, 42), bold=True)
        
        p1 = c1.paragraphs[0]
        p1.paragraph_format.space_after = Pt(2)
        r1 = p1.add_run(v)
        format_run(r1, font_name="Calibri", size_pt=9.5, color_rgb=RGBColor(51, 65, 85))
    
    doc.add_paragraph().paragraph_format.space_after = Pt(10)
    
    # Executive Alert / Notice Box
    add_callout_box(
        doc,
        "📌 IMPORTANT NOTICE FOR CLIENT & DEVELOPMENT STAKEHOLDERS:",
        "This deliverable is a comprehensive UI/UX reference and functional specification document. "
        "The accompanying codebase is an interactive, fully responsive client-side prototype created specifically "
        "to validate workflows, layouts, parent journeys, time-scheduling rules, and administrative capabilities. "
        "The finalized production system will be developed from the ground up using enterprise Angular on the frontend "
        "and ASP.NET Core Web API with Microsoft SQL Server on the backend.",
        bg_hex="FFF7ED",
        border_hex="EA580C"
    )
    
    # Overall Multi-Device Preview Placeholder
    add_image_placeholder(
        doc,
        "Overall Web Application Homepage & Multi-Device UI Preview",
        "Full desktop landing view along with iPad tablet and mobile responsive layout"
    )
    
    # ---------------------------------------------------------------------------
    # SECTION 1: EXECUTIVE SUMMARY & ARCHITECTURAL FOUNDATION
    # ---------------------------------------------------------------------------
    add_heading_1(doc, "1. Executive Summary & Enterprise Architecture Blueprint")
    
    add_body_p(
        doc,
        "Christina Nursery and Primary School (Anna Nagar, Chennai) requires an institutional web platform that reflects its "
        "30+ year heritage of joyful foundational learning (Nursery to Grade 5), provides parents with seamless access to notices and circulars, "
        "drives admissions through a streamlined digital pipeline, and equips school administrators with an intuitive management dashboard."
    )
    
    add_heading_2(doc, "1.1 Prototype Role vs. Target Production Stack")
    add_body_p(
        doc,
        "To eliminate requirements ambiguity and ensure an engaging visual experience, this prototype was engineered as an interactive Single-Page Application (SPA). "
        "The table below contrasts the role of the design prototype against the upcoming production enterprise release:"
    )
    
    # Tech Comparison Table
    tech_table = doc.add_table(rows=7, cols=3)
    tech_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    tech_table.autofit = False
    
    tech_headers = ["Platform Dimension", "Interactive Prototype (Current Reference)", "Enterprise Production Build (Target)"]
    t_widths = [Inches(1.8), Inches(2.3), Inches(2.4)]
    
    # Header row
    for j, h_text in enumerate(tech_headers):
        cell = tech_table.rows[0].cells[j]
        cell.width = t_widths[j]
        set_cell_background(cell, "0A1B3D")
        set_cell_margins(cell, top=140, bottom=140, left=140, right=140)
        p = cell.paragraphs[0]
        p.paragraph_format.space_after = Pt(2)
        r = p.add_run(h_text)
        format_run(r, font_name="Calibri", size_pt=9.5, color_rgb=RGBColor(255, 255, 255), bold=True)
    
    tech_rows = [
        ("Frontend Architecture", "Vanilla ES6+, Hash Router, In-Memory Template Cache", "Angular 18+ (Standalone Components, Signals, RxJS, NgRx)"),
        ("Styling & Design System", "15 Modular CSS Sheets + Global Design Tokens", "Tailwind CSS / Angular Material / Scoped SCSS Modules"),
        ("Backend Services", "In-Memory Client Mock Database (`db` in `data.js`)", "ASP.NET Core 8 Web API (C#, Clean Architecture, CQRS)"),
        ("Database & Persistence", "Local State & SessionStorage", "Microsoft SQL Server / PostgreSQL via Entity Framework Core"),
        ("Security & Auth", "Client Mock Session Guard", "JWT Bearer Authentication, ASP.NET Identity, Role-Based Access (RBAC)"),
        ("File & Media Storage", "Inline SVGs & Local Asset Directory", "Azure Blob Storage / AWS S3 with Cloudflare Image CDN")
    ]
    
    for i, row_data in enumerate(tech_rows):
        row = tech_table.rows[i + 1]
        bg = "F8FAFC" if i % 2 == 0 else "FFFFFF"
        for j, text in enumerate(row_data):
            cell = row.cells[j]
            cell.width = t_widths[j]
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=100, bottom=100, left=120, right=120)
            set_cell_borders(cell, top="E2E8F0", bottom="E2E8F0", left="E2E8F0", right="E2E8F0")
            p = cell.paragraphs[0]
            p.paragraph_format.space_after = Pt(2)
            r = p.add_run(text)
            bold_flag = (j == 0)
            format_run(r, font_name="Calibri", size_pt=9, color_rgb=RGBColor(30, 41, 59), bold=bold_flag)
    
    doc.add_paragraph().paragraph_format.space_after = Pt(8)
    
    add_heading_2(doc, "1.2 Responsive Design & Mobile-First Principles")
    add_body_p(
        doc,
        "Because over 80% of parent interactions (checking notice board, viewing homework updates, messaging the school office on WhatsApp) "
        "occur on mobile smartphones and tablets, the entire UI design has been developed and verified under rigorous responsive constraints:"
    )
    add_bullet(doc, "Mobile Devices (< 600px)", "One-column layout, touch-sized tap targets (min 44px), full-width action buttons, zero horizontal overflow.")
    add_bullet(doc, "Tablets & iPads (600px - 1024px)", "Two-column grid adaptation, collapsible navigation drawer, proportional padding, non-cramped headers.")
    add_bullet(doc, "Desktop & Laptops (> 1024px)", "Rich multi-column grids, interactive cards, live count-up metrics, desktop topbar contact strip.")
    
    # ---------------------------------------------------------------------------
    # SECTION 2: PUBLIC PORTAL — UI & FUNCTIONAL SPECIFICATIONS
    # ---------------------------------------------------------------------------
    add_heading_1(doc, "2. Public Portal — Feature & UI Specifications")
    add_body_p(
        doc,
        "The public-facing portal is designed to establish trust, communicate educational philosophy, and deliver fast, accessible information to parents. "
        "Below is a granular breakdown of all 14 portal features:"
    )
    
    # 2.1 Header & Navigation
    add_heading_2(doc, "2.1 Header, Navigation Strip & Dynamic News Ticker")
    add_body_p(
        doc,
        "The top navigation system anchors the website with a persistent identity and convenient parent utility links:"
    )
    add_bullet(doc, "Top Contact Bar", "Displays campus telephone (+91 44 2855 3400), official email, school working hours, live admissions pill badge, and secure Parent/Admin login link. Progressively contracts to a clean single line on mobile devices.")
    add_bullet(doc, "Sticky Primary Navbar", "Features the official Christina School crest logo, school typography, desktop navigation links, 'Enquire now' CTA, and mobile hamburger button.")
    add_bullet(doc, "Edge-to-Edge Mobile Balance", "On tablets and mobile devices, the logo is pinned to the far left, and the hamburger button is pinned to the far right with full screen width between them.")
    add_bullet(doc, "Sliding Mobile Drawer", "Offers quick touch access to all 12 portal sections, complete with backdrop blur, touch-friendly list items, and emergency direct-call buttons.")
    add_bullet(doc, "Continuous News Ticker", "A vibrant gradient banner with a fixed 'Latest' badge that continuously streams real-time updates and emergency notices across the screen.")
    
    add_image_placeholder(
        doc,
        "Sticky Navigation Header, Topbar Contact Strip & Sliding Mobile Drawer Menu",
        "Desktop topbar + header view and Mobile viewport showing the sliding drawer navigation"
    )
    
    # 2.2 Home Landing Page
    add_heading_2(doc, "2.2 Home Landing Page (`#/home`)")
    add_body_p(
        doc,
        "The landing page serves as the digital front door of the school, combining emotional storytelling with comprehensive functional previews:"
    )
    add_bullet(doc, "Hero Section", "A navy-to-azure gradient banner featuring the inspirational school headline, class size commitments, direct CTA buttons ('Start an admission enquiry' / 'Explore the school'), and an interactive hero preview scene.")
    add_bullet(doc, "Marked Announcement Pill", "Positioned directly inside the hero area, highlighting the latest active circular with an animated amber pulsing badge (`.ann-pulse`). Clicking it opens the full announcement details.")
    add_bullet(doc, "Automated Time-Scheduled Announcement Pop-Up Dialog", "When users land on the homepage, the system evaluates active announcements. If an announcement is flagged for pop-up and falls within its scheduled start/end datetime window, an eye-catching dialog box automatically appears. The dialog includes notice title, category tag, validity dates, a close/dismiss option (remembered via sessionStorage), and a direct routing button that opens the full circular.")
    add_bullet(doc, "Live Metrics Counters", "Animated counters highlighting key school facts (1:14 teacher-child ratio, 100% verified staff, 34 full-time educators, 14 GPS bus routes).")
    add_bullet(doc, "Academic Stages Summary", "Highlights Early Years (Nursery, LKG, UKG) and Primary School (Grades 1 to 5) with curriculum points and facility highlights.")
    add_bullet(doc, "Why Choose Christina Bento Grid", "A 4-pillar bento showcase highlighting: Teachers Who Stay, 1 Hour Outdoors Daily, Hands-On Labs, and Safe Caring Campus.")
    add_bullet(doc, "Notices & Upcoming Events Preview", "Dual-column dashboard showing the top pinned notice alongside the upcoming calendar events list.")
    add_bullet(doc, "Faculty Spotlight", "Welcoming statement from the Principal alongside featured teacher profile cards.")
    add_bullet(doc, "Student Life & Gallery Highlights", "Previews co-curricular clubs, sports, and a 4-photo campus mosaic.")
    add_bullet(doc, "Parent Testimonials Carousel", "Rotating quotes from verified parents sharing their experiences.")
    add_bullet(doc, "The Christina Chronicle Journal Preview", "Displays top 3 latest school stories and news dispatches.")
    add_bullet(doc, "Admissions & Campus Tour CTA Banner", "High-conversion banner inviting parents to schedule an in-person school tour.")
    
    add_image_placeholder(
        doc,
        "Home Landing Page — Hero Section, Marked Announcement Pill & Live Impact Metrics",
        "Full desktop view of the hero section showing the announcement pill and count-up stats"
    )
    
    add_image_placeholder(
        doc,
        "Automated Time-Scheduled Announcement Pop-Up Dialog Box",
        "Modal pop-up dialog appearing on home landing showing start/end dates and routing button"
    )
    
    add_image_placeholder(
        doc,
        "Home Page — Academic Stages, Why Christina Bento & Dual Notices/Calendar Preview",
        "Desktop and tablet view of the stage highlights and 4-pillar bento grid"
    )
    
    # 2.3 About Page
    add_heading_2(doc, "2.3 About the School (`#/about`)")
    add_body_p(
        doc,
        "Details the institutional heritage, philosophy, and six fundamental differentiators of Christina Nursery and Primary School:"
    )
    add_bullet(doc, "Layered Visual Composition", "Artistic photo layout featuring the campus courtyard, historical milestone chip, and school crest badge.")
    add_bullet(doc, "Vision, Mission & Values Accordion", "Interactive expanding panels covering Academic Excellence, Character Building, Joyful Foundation, and Community Partnership.")
    add_bullet(doc, "Six Differentiators Bento Grid", "Balanced grid detailing faculty retention, timetabled outdoor play, mastery learning, technology in classrooms, circle time character building, and comprehensive campus safety.")
    
    add_image_placeholder(
        doc,
        "About Page — Layered Photo Composition, Accordion & Responsive Bento Grid",
        "Desktop view and tablet view showing the 6-item bento grid adapting to 2 columns"
    )
    
    # 2.4 Academics Page
    add_heading_2(doc, "2.4 Academics & Campus Facilities (`#/academics`)")
    add_body_p(
        doc,
        "Provides parents with transparent insight into curriculum progression from Nursery to Grade 5:"
    )
    add_bullet(doc, "Stage Switcher Tabs", "Toggle between 'Early Years (Nursery to UKG)' and 'Primary (Grades 1 to 5)'.")
    add_bullet(doc, "Interactive Grade Rail", "Scrollable selector allowing parents to click individual grades (Nursery, LKG, UKG, Grade 1 through 5) to inspect specific curriculum focuses.")
    add_bullet(doc, "Dynamic Grade Panel", "Displays core subjects, weekly activities, class size caps (max 25), teacher-to-student ratios, and daily home activity expectations.")
    add_bullet(doc, "Campus Facilities Photo Mosaic", "Interactive photo tiles highlighting classrooms, smart boards, library, discovery lab, and playground.")
    add_bullet(doc, "Safety & Transport Guarantee", "Detailed cards confirming CCTV surveillance, background-verified staff, on-site pediatric nurse, and GPS-tracked buses with female attendants.")
    
    add_image_placeholder(
        doc,
        "Academics Page — Grade Rail Selector, Dynamic Grade Focus Panel & Campus Photo Mosaic",
        "Interactive grade switcher and facilities mosaic on desktop and mobile"
    )
    
    # 2.5 Staff Directory
    add_heading_2(doc, "2.5 Faculty & Staff Directory (`#/staff`)")
    add_body_p(
        doc,
        "Introduces parents to the 34 full-time educators who nurture and mentor their children daily:"
    )
    add_bullet(doc, "Instant Teacher Search", "Real-time search filtering by teacher name, subject, or assigned grade.")
    add_bullet(doc, "Department Filter Chips", "Quick toggle chips (Administration, Kindergarten, Primary Languages, Mathematics, Science, Arts & Physical Ed).")
    add_bullet(doc, "Teacher Profile Cards", "Photo cards displaying designation, department badge, educational qualifications (e.g. M.Sc., B.Ed., Montessori certified), years of experience, and subjects handled.")
    add_bullet(doc, "Detailed Profile Modal", "Clicking 'View full profile' displays a detailed modal biography with classroom philosophy and classes handled.")
    
    add_image_placeholder(
        doc,
        "Faculty Directory — Search Bar, Department Chips & Teacher Profile Cards Modal",
        "Staff grid with filter chips active and detailed teacher bio pop-up dialog"
    )
    
    # 2.6 Activities & Sports
    add_heading_2(doc, "2.6 Student Life, Clubs & Sports Rail (`#/activities`)")
    add_body_p(
        doc,
        "Highlights the co-curricular ecosystem that builds confidence, social skills, and physical health:"
    )
    add_bullet(doc, "Co-Curricular Clubs Grid", "Color-coded cards for Art & Craft, Junior Robotics, Nature & Gardening, Drama & Elocution, Music & Choir, and Chess.")
    add_bullet(doc, "Touch-Draggable Sports Rail", "Horizontal snap-scrolling rail showcasing Athletics, Football, Cricket, Badminton, Chess, and Yoga with house team levels.")
    add_bullet(doc, "Student Achievements Showcase", "Gold, silver, and bronze badge cards celebrating interschool science, art, athletics, and academic honors.")
    
    add_image_placeholder(
        doc,
        "Student Life — Co-Curricular Clubs Grid, Draggable Sports Rail & Student Achievements",
        "Clubs grid with hover interactions and sports carousel with navigation controls"
    )
    
    # 2.7 Announcements & Events
    add_heading_2(doc, "2.7 Notice Board & Academic Calendar (`#/announcements`)")
    add_body_p(
        doc,
        "The central communication hub connecting parents with circulars, timetable updates, and upcoming school events:"
    )
    add_bullet(doc, "Pinned Notice Banner", "High-visibility navy banner highlighting critical active announcements.")
    add_bullet(doc, "Notice Category Filter", "Categorized tabs for All, Academic, Events, Holidays, and Urgent Notices.")
    add_bullet(doc, "Upcoming Events Calendar", "Chronological list of school milestones with date blocks, start/end times, and campus venue.")
    add_bullet(doc, "Full Notice Reader Modal", "Displays full circular text, active schedule, and a 'Copy this notice' button for parents to share circulars via WhatsApp.")
    
    add_image_placeholder(
        doc,
        "Notice Board — Pinned Announcement Banner, Notices Grid & Circular Reader Modal",
        "Notice board filter tabs and circular pop-up with copy-to-clipboard button"
    )
    
    # 2.8 Gallery
    add_heading_2(doc, "2.8 Photo Gallery & Lightbox (`#/gallery`)")
    add_body_p(
        doc,
        "A photo showcase of life at Christina Nursery and Primary School:"
    )
    add_bullet(doc, "Album Category Filtering", "Filter photographs across All, Sports Day, Science Expo, Annual Day, Kindergarten, and Field Trips.")
    add_bullet(doc, "Masonry Grid Layout", "Adaptive columns that adjust gracefully from 4 columns on desktop down to 1 column on mobile phones.")
    add_bullet(doc, "Full-Screen Lightbox", "Darkened overlay with image zoom, captions, photo index counter, and left/right keyboard navigation.")
    
    add_image_placeholder(
        doc,
        "Photo Gallery — Masonry Grid Layout & Full-Screen Lightbox Viewer",
        "Photo masonry grid and expanded high-resolution image preview lightbox"
    )
    
    # 2.9 News
    add_heading_2(doc, "2.9 The Christina Chronicle — News & Updates (`#/news`)")
    add_body_p(
        doc,
        "Dedicated editorial magazine featuring articles and dispatches written by faculty members:"
    )
    add_bullet(doc, "News Page Hero Banner", "Dark azure hero with breadcrumb navigation, title, and editorial introduction.")
    add_bullet(doc, "Featured Story Spotlight Card", "Large visual card highlighting the lead article of the month with author byline and summary.")
    add_bullet(doc, "Topic Filtering & Search Box", "Filter stories by Academic, Sports, Campus, or Events, with a live keyword search input.")
    add_bullet(doc, "Weekly Dispatch Newsletter Subscription", "Parent subscription card for receiving the Friday email digest.")
    
    add_image_placeholder(
        doc,
        "The Christina Chronicle — News Page Hero, Spotlight Feature Card & Article Grid",
        "News hero banner, spotlight story with author byline, and article grid"
    )
    
    # 2.10 Admissions
    add_heading_2(doc, "2.10 Admissions Portal (`#/admissions`)")
    add_body_p(
        doc,
        "Designed to remove friction and guide prospective families smoothly through enrollment:"
    )
    add_bullet(doc, "5-Step Roadmap Timeline", "Numbered process flow: 1. Enquiry, 2. Campus Walkthrough, 3. Child Interaction, 4. Offer Letter, 5. Welcome Kit.")
    add_bullet(doc, "Required Documents Checklist", "Grid checklist outlining required paperwork (Birth Certificate, Immunization Record, Address Proof, Photos).")
    add_bullet(doc, "Digital Admission Enquiry Form", "Interactive form with parent name, phone number, child name, date of birth, grade wanted dropdown, and optional message.")
    add_bullet(doc, "Direct Helpline Call Strip", "Banner with direct phone link to the admissions coordinator.")
    
    add_image_placeholder(
        doc,
        "Admissions Portal — 5-Step Process Roadmap & Online Admission Enquiry Form",
        "Roadmap timeline alongside the interactive enquiry form card"
    )
    
    # 2.11 Contact
    add_heading_2(doc, "2.11 Contact & Campus Tour (`#/contact`)")
    add_body_p(
        doc,
        "Comprehensive contact directory and parent inquiry portal:"
    )
    add_bullet(doc, "Campus Address & Contact Details", "Physical address on Kamaraj Avenue, Anna Nagar West, direct office telephone lines, and email inboxes.")
    add_bullet(doc, "Campus Tour Timings", "Details on weekday tours (10:00 AM and 2:00 PM) without prior appointment requirement.")
    add_bullet(doc, "Interactive Campus Map Scene", "Stylized SVG map graphic with a 'Get directions' button linked to Google Maps.")
    add_bullet(doc, "Parent Message Desk Form", "General inquiry form for transport changes, fee queries, or teacher notes.")
    
    add_image_placeholder(
        doc,
        "Contact Page — Campus Directory Cards, Interactive Map Scene & Office Message Form",
        "Contact information cards, office hours, and the message desk form"
    )
    
    # 2.12 Testimonials & Documents
    add_heading_2(doc, "2.12 Parent Voices (`#/testimonials`) & Document Library (`#/documents`)")
    add_body_p(
        doc,
        "Features verifying community trust and enabling self-service document access:"
    )
    add_bullet(doc, "Parent Reviews Carousel", "Interactive slider displaying verified parent feedback with child grades, quote badges, and dot indicators.")
    add_bullet(doc, "Downloadable Document Cards", "Centralized repository for PDF downloads: Admission Forms, Fee Structure, Bus Routes, Academic Calendar, Health & Safety Guidelines.")
    
    add_image_placeholder(
        doc,
        "Parent Reviews Carousel & Downloadable Document Library Cards",
        "Parent testimonial slider and document cards with download action buttons"
    )
    
    # 2.13 Floating Actions & Footer
    add_heading_2(doc, "2.13 Floating Assistance Controls & Comprehensive Footer")
    add_body_p(
        doc,
        "Persistent utilities that improve usability across all screen sizes:"
    )
    add_bullet(doc, "WhatsApp Direct Chat (Bottom-Left)", "Fixed green WhatsApp icon in the bottom-left corner with safe-area insets, providing instant 1-click messaging with the school office.")
    add_bullet(doc, "Back-to-Top Indicator (Bottom-Right)", "Fixed navy circular button in the bottom-right corner featuring a radial SVG scroll progress ring and smooth scroll-to-top behavior.")
    add_bullet(doc, "Zero Collision Layout", "WhatsApp and Back-to-Top sit in opposite corners, ensuring left/right thumb convenience and zero overlap.")
    add_bullet(doc, "Responsive Site Footer", "Features school mission, quick links, academic links, admissions contact, and copyright/policy links. Adapts from 4 columns on desktop to 2 columns on tablet and 1 column on mobile.")
    
    add_image_placeholder(
        doc,
        "Opposite-Corner Floating Buttons (WhatsApp & Back-to-Top) & Responsive Footer",
        "Mobile viewport showing WhatsApp on bottom-left, Back-to-Top on bottom-right, and the 1-column footer"
    )
    
    # ---------------------------------------------------------------------------
    # SECTION 3: ADMINISTRATIVE DASHBOARD SPECIFICATION
    # ---------------------------------------------------------------------------
    add_heading_1(doc, "3. Administrative Dashboard Specification (`admin-dashboard.html`)")
    add_body_p(
        doc,
        "The administrative dashboard provides school leaders, principals, and administrative staff with a self-service console "
        "to manage website content, schedule announcements, review inquiries, and update faculty profiles without developer intervention."
    )
    
    add_heading_2(doc, "3.1 Dashboard Architecture & Role-Based Modules")
    add_body_p(
        doc,
        "The dashboard is structured into 10 dedicated management modules accessible via a responsive sidebar with mobile drawer support:"
    )
    
    # Modules Table
    admin_table = doc.add_table(rows=11, cols=3)
    admin_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    admin_table.autofit = False
    
    adm_headers = ["Module", "Core Features & Operations", "Target Production API Endpoint"]
    adm_widths = [Inches(1.6), Inches(3.2), Inches(1.7)]
    
    for j, h_text in enumerate(adm_headers):
        cell = admin_table.rows[0].cells[j]
        cell.width = adm_widths[j]
        set_cell_background(cell, "0A1B3D")
        set_cell_margins(cell, top=140, bottom=140, left=140, right=140)
        p = cell.paragraphs[0]
        p.paragraph_format.space_after = Pt(2)
        r = p.add_run(h_text)
        format_run(r, font_name="Calibri", size_pt=9.5, color_rgb=RGBColor(255, 255, 255), bold=True)
    
    admin_modules = [
        ("Dashboard Overview", "Live KPI summary cards, monthly enquiry trend bar chart, real-time activity feed, quick entity creation.", "GET /api/v1/admin/analytics/overview"),
        ("Staff Profiles", "Search, department filter, add teacher modal, qualifications, experience, active visibility toggle.", "CRUD /api/v1/admin/staff"),
        ("Announcements & Circulars", "Title, category, body text, PIN to notice board, Datetime start/end scheduling, homepage popup toggle.", "CRUD /api/v1/admin/announcements"),
        ("Gallery & Albums", "Create albums, upload high-res event photographs, assign category tags, delete photos.", "CRUD /api/v1/admin/gallery"),
        ("Events & Calendar", "Add academic events, sports meets, term dates, venue, start/end dates.", "CRUD /api/v1/admin/events"),
        ("Achievements", "Student honors, interschool competition results, award level (Gold/Silver/Bronze).", "CRUD /api/v1/admin/achievements"),
        ("News & Stories", "Publish teacher-written dispatches, assign author bylines, featured spotlight toggle.", "CRUD /api/v1/admin/news"),
        ("Documents Library", "Upload official school PDFs (admission forms, fee schedule, bus routes, safety policy).", "CRUD /api/v1/admin/documents"),
        ("Admission Enquiries CRM", "Pipeline tracking (New, Under Review, Tour Scheduled, Interview, Admitted, Closed), 1-click parent call, note logging.", "CRUD /api/v1/admin/enquiries"),
        ("School Settings", "Update school name, campus address, telephone lines, office hours, and scrolling ticker text.", "PUT /api/v1/admin/settings")
    ]
    
    for i, (m_name, m_feat, m_api) in enumerate(admin_modules):
        row = admin_table.rows[i + 1]
        bg = "F8FAFC" if i % 2 == 0 else "FFFFFF"
        for j, text in enumerate([m_name, m_feat, m_api]):
            cell = row.cells[j]
            cell.width = adm_widths[j]
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=100, bottom=100, left=120, right=120)
            set_cell_borders(cell, top="E2E8F0", bottom="E2E8F0", left="E2E8F0", right="E2E8F0")
            p = cell.paragraphs[0]
            p.paragraph_format.space_after = Pt(2)
            r = p.add_run(text)
            bold_flag = (j == 0)
            font_size = 8.5 if j == 2 else 9
            format_run(r, font_name="Calibri", size_pt=font_size, color_rgb=RGBColor(30, 41, 59), bold=bold_flag)
    
    doc.add_paragraph().paragraph_format.space_after = Pt(8)
    
    add_heading_2(doc, "3.2 Highlight: Time-Scheduled Announcements Engine")
    add_body_p(
        doc,
        "A critical feature demonstrated in the prototype is the **Active Schedule Engine** for announcements and circulars. "
        "School staff can schedule notices with exact starting and ending timestamps:"
    )
    add_bullet(doc, "Start Date & Time (`startDate`)", "Using `<input type='datetime-local'>`, administrators specify the exact moment a notice becomes live on the website.")
    add_bullet(doc, "End Date & Time (`endDate`)", "Specifies when the notice should automatically expire and stop showing in the home pop-up dialog.")
    add_bullet(doc, "Pinned / Pop-up Toggle", "Controls whether the announcement is pinned to the top of the notice board and displayed as a modal pop-up on the homepage.")
    add_bullet(doc, "Production Implementation", "In the production .NET backend, a background worker (Quartz.NET or `IHostedService`) evaluates notice active windows and broadcasts real-time updates via SignalR.")
    
    add_image_placeholder(
        doc,
        "Admin Dashboard Overview — Analytics KPIs, Enquiry Trend Bar Chart & Live Activity Feed",
        "Admin dashboard overview view showing summary stats, monthly chart, and recent actions"
    )
    
    add_image_placeholder(
        doc,
        "Admin Announcements Manager & Datetime Scheduling Modal",
        "Table of announcements showing schedule status and modal editor with datetime-local inputs"
    )
    
    add_image_placeholder(
        doc,
        "Admin Admissions Enquiries CRM Pipeline & Review Dialog",
        "Enquiries table with status chips (New, Tour, Admitted) and modal enquiry detail view"
    )
    
    # ---------------------------------------------------------------------------
    # SECTION 4: PRODUCTION MIGRATION ROADMAP (ANGULAR & .NET CORE)
    # ---------------------------------------------------------------------------
    add_heading_1(doc, "4. Production Engineering Blueprint (Angular & ASP.NET Core)")
    add_body_p(
        doc,
        "This section details how the UI reference will be systematically transformed into an enterprise web platform using "
        "Angular 18+ on the frontend and ASP.NET Core 8 Web API on the backend."
    )
    
    add_heading_2(doc, "4.1 Frontend Architecture (Angular 18+)")
    add_bullet(doc, "Standalone Component Architecture", "Eliminates NgModule boilerplate. Each page (Home, About, Academics, Staff, News, etc.) is a standalone lazy-loaded routed component.")
    add_bullet(doc, "State Management via Signals & RxJS", "Angular Signals provide fine-grained reactivity for UI state (e.g. active stage tab, announcement pop-up visibility, search queries), while RxJS handles HTTP communication.")
    add_bullet(doc, "Reactive Forms with Asynchronous Validators", "Admission enquiry and contact forms will use `FormGroup` with client-side pattern validation and server-side phone/email verification.")
    add_bullet(doc, "Server-Side Rendering (Angular SSR)", "Ensures optimal SEO rankings on Google for keywords like 'Best nursery school in Anna Nagar Chennai' and fast initial page load.")
    add_bullet(doc, "Progressive Web App (PWA) Capabilities", "Enables parents to install the school portal on their Android or iPhone home screens with offline notice caching.")
    
    add_heading_2(doc, "4.2 Backend Architecture (ASP.NET Core 8 Web API)")
    add_bullet(doc, "Clean Architecture Pattern", "Strict separation of concerns into Domain, Application (CQRS with MediatR), Infrastructure (EF Core, Azure Blob, SendGrid), and WebAPI layers.")
    add_bullet(doc, "Entity Framework Core Database Layer", "Code-First migrations with Microsoft SQL Server, ensuring strongly typed schema management and query optimization.")
    add_bullet(doc, "Authentication & Security", "JWT Bearer Tokens, refresh token rotation, password hashing with PBKDF2/BCrypt, and ASP.NET Identity role authorization (Roles: Admin, Principal, AdmissionsCoordinator, Staff).")
    add_bullet(doc, "Media & Document Storage", "Azure Blob Storage / AWS S3 integration with SAS tokens for secure PDF downloads and auto-resized WebP gallery images.")
    add_bullet(doc, "Real-Time Notifications", "SignalR hub for instant push notifications to administrators when new admission enquiries arrive.")
    
    add_heading_2(doc, "4.3 Database Schema Entity-Relationship Blueprint")
    add_body_p(
        doc,
        "The relational database schema will consist of the following primary tables in Microsoft SQL Server:"
    )
    add_bullet(doc, "StaffMembers", "Id, FullName, Designation, DepartmentId, Qualification, YearsExperience, ClassesHandled, Subjects, Biography, PhotoUrl, IsActive, CreatedAt.")
    add_bullet(doc, "Announcements", "Id, Title, CategoryId, Status (Draft/Published), Pinned, ShowPopup, StartDateTime, EndDateTime, ExpiryDate, ShortSummary, FullBodyHtml, CreatedAt.")
    add_bullet(doc, "AdmissionEnquiries", "Id, ParentName, PhoneNumber, EmailAddress, ChildName, ChildDateOfBirth, GradeWanted, MessageText, PipelineStatus (New/Review/Tour/Admitted/Closed), CreatedAt, UpdatedAt.")
    add_bullet(doc, "Events", "Id, Title, CategoryId, EventDate, StartTime, EndTime, Venue, DescriptionHtml, IsPublic.")
    add_bullet(doc, "GalleryAlbums & Photos", "AlbumId, AlbumName, CategoryId, CoverPhotoUrl; PhotoId, AlbumId, Caption, HighResUrl, ThumbnailUrl, DisplayOrder.")
    add_bullet(doc, "NewsArticles", "Id, Title, CategoryId, Summary, BodyMarkdown, AuthorStaffId, FeaturedImageUrl, IsSpotlight, PublishedAt.")
    add_bullet(doc, "SchoolDocuments", "Id, Title, CategoryId, AudienceTag, FileUrl, FileSizeBytes, FileType, PublishedDate.")
    add_bullet(doc, "SchoolSettings", "Id, SchoolName, Tagline, Address, PhoneOffice, PhoneAdmissions, EmailOffice, OfficeHours, TickerText, LastModifiedAt.")
    
    add_image_placeholder(
        doc,
        "Database Entity-Relationship Diagram (ERD) & API Architecture Schema",
        "Relational schema diagram illustrating table relationships and Web API controller architecture"
    )
    
    # ---------------------------------------------------------------------------
    # SECTION 5: IMPLEMENTATION ROADMAP & DELIVERABLE CHECKLIST
    # ---------------------------------------------------------------------------
    add_heading_1(doc, "5. Implementation Roadmap & Production Milestone Schedule")
    add_body_p(
        doc,
        "The transition from this functional UI reference prototype to the live Angular + ASP.NET Core production system "
        "will follow a phased 6-sprint engineering plan:"
    )
    
    # Roadmap Table
    roadmap_table = doc.add_table(rows=7, cols=3)
    roadmap_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    roadmap_table.autofit = False
    
    rm_headers = ["Phase & Sprint", "Scope & Deliverables", "Target Timeline"]
    rm_widths = [Inches(1.6), Inches(3.4), Inches(1.5)]
    
    for j, h_text in enumerate(rm_headers):
        cell = roadmap_table.rows[0].cells[j]
        cell.width = rm_widths[j]
        set_cell_background(cell, "0A1B3D")
        set_cell_margins(cell, top=140, bottom=140, left=140, right=140)
        p = cell.paragraphs[0]
        p.paragraph_format.space_after = Pt(2)
        r = p.add_run(h_text)
        format_run(r, font_name="Calibri", size_pt=9.5, color_rgb=RGBColor(255, 255, 255), bold=True)
    
    roadmap_phases = [
        ("Phase 1: Project Setup", "Repo setup, ASP.NET Core Web API template, EF Core migrations, SQL Server DB initialization, Angular 18 project with Tailwind.", "Sprint 1 (Weeks 1–2)"),
        ("Phase 2: Authentication & Core Admin", "ASP.NET Identity, JWT login, admin layout, School Settings, Staff directory CRUD, Dashboard KPIs.", "Sprint 2 (Weeks 3–4)"),
        ("Phase 3: Public Portal UI Components", "Angular port of Home, About, Academics, Staff, and Activities with full responsive fidelity.", "Sprint 3 (Weeks 5–6)"),
        ("Phase 4: Content & Communications", "Announcements engine with datetime scheduling, News studio, Gallery albums with cloud storage, Notice board.", "Sprint 4 (Weeks 7–8)"),
        ("Phase 5: Admissions & Enquiry Pipeline", "Interactive admission enquiry form, validation, CRM pipeline tracker, email & SMS notifications.", "Sprint 5 (Weeks 9–10)"),
        ("Phase 6: QA, Security & Deployment", "End-to-end testing, responsive cross-device verification, Azure/AWS deployment, SSL setup, client training.", "Sprint 6 (Weeks 11–12)")
    ]
    
    for i, (p_name, p_del, p_time) in enumerate(roadmap_phases):
        row = roadmap_table.rows[i + 1]
        bg = "F8FAFC" if i % 2 == 0 else "FFFFFF"
        for j, text in enumerate([p_name, p_del, p_time]):
            cell = row.cells[j]
            cell.width = rm_widths[j]
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=100, bottom=100, left=120, right=120)
            set_cell_borders(cell, top="E2E8F0", bottom="E2E8F0", left="E2E8F0", right="E2E8F0")
            p = cell.paragraphs[0]
            p.paragraph_format.space_after = Pt(2)
            r = p.add_run(text)
            bold_flag = (j == 0)
            format_run(r, font_name="Calibri", size_pt=9, color_rgb=RGBColor(30, 41, 59), bold=bold_flag)
    
    doc.add_paragraph().paragraph_format.space_after = Pt(14)
    
    # Closing Sign-Off Box
    add_callout_box(
        doc,
        "🤝 CLIENT FEEDBACK & NEXT STEPS:",
        "This specification document and prototype are now ready for stakeholder review. "
        "School trustees and administrative leadership are encouraged to test user flows on mobile phones, tablets, "
        "and desktop browsers. Upon sign-off on the layout and features, Phase 1 implementation in Angular and .NET Core will commence.",
        bg_hex="F0FDF4",
        border_hex="16A34A"
    )
    
    output_path = r"c:\Users\corpo\Downloads\PLexo\Christina_School_UI_Reference_Specification.docx"
    doc.save(output_path)
    print(f"Documentation generated successfully at: {output_path}")

if __name__ == "__main__":
    build_client_documentation()
