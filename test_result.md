#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

user_problem_statement: |
  Integrate a Python TCP port-scanner tool into the existing Cyber Shield (Amroha Cyber Crime PS)
  investigation suite. Also build out selected "upcoming" tools, add a new "Tools Directory" tab
  listing AI-agentic / AI / open-source / manual cyber tools used by police (with usage + best-case),
  and add an IPv4 -> IPv6 converter tool. Approved scope (in order): A) Port Scanner, B) IPv4->IPv6
  Converter, C) Tools Directory (curated list + search filter), D) Password Breach Checker
  (free HaveIBeenPwned Pwned Passwords range API). Phone/UPI and Bulk IP/URL were deferred (kept on
  the roadmap). Expand the "coming soon" list with more upcoming tools.
  NOTE: Environment had lost backend/.env and frontend/.env; main agent recreated them
  (MONGO_URL, DB_NAME=cyber_shield, CORS_ORIGINS, EMERGENT_LLM_KEY, REACT_APP_BACKEND_URL).

backend:
  - task: "Port Scanner endpoint (POST /api/tools/port-scan)"
    implemented: true
    working: "NA"
    file: "routes_tools.py, scan_service.py, llm_service.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "Async TCP-connect scanner. Resolves host->IPv4, scans DEFAULT_COMMON ports plus an optional custom range (capped at 1024). Returns open ports w/ service names, then Claude analyzes exposure + risk. Saves to analyses. Verified standalone against scanme.nmap.org (found 22/SSH, 80/HTTP). Modes: 'common' and 'common_range' (needs start_port/end_port). Invalid host -> 400 (socket.gaierror), invalid range -> 400."

  - task: "IPv4 to IPv6 converter endpoint (POST /api/tools/ipv6-convert)"
    implemented: true
    working: "NA"
    file: "routes_tools.py, convert_service.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "Deterministic (no LLM). Returns IPv4-mapped, 6to4 /48 prefix, IPv4-compatible (deprecated), expanded forms, scope flags. Builds markdown locally. risk_level null. Invalid IPv4 -> 400. Saves to analyses with meta.conversions."

  - task: "Password Breach Checker endpoint (POST /api/tools/breach-check)"
    implemented: true
    working: "NA"
    file: "routes_tools.py, breach_service.py, llm_service.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "Uses HaveIBeenPwned Pwned Passwords range API (k-anonymity, SHA-1 prefix, Add-Padding). PLAINTEXT PASSWORD IS NEVER STORED — saved input only contains {length, note}. risk derived from breach count (>=100k critical, >=1k high, >0 medium, else clean). Claude gives advisory WITHOUT receiving the password. Verified: 'password' -> found count ~52M; strong random -> not found."

  - task: "Tools Directory catalog endpoint (GET /api/catalog/tools)"
    implemented: true
    working: "NA"
    file: "routes_catalog.py, catalog.py, server.py"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "Auth-protected. Returns {types(4), categories(21), tools(32), count}. Static curated reference content (AI-agentic, AI-assisted, open-source, commercial). Verified 200 with token."

  - task: "New tool types in history, stats breakdown, and PDF labels"
    implemented: true
    working: "NA"
    file: "routes_stats.py, pdf_service.py, routes_history.py"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "Added port-scan, ipv6-convert, breach-verify to stats tool_breakdown and pdf_service TOOL_LABELS. History list/get/delete + /api/history/{id}/pdf should work for new tool types. Needs verification that PDF generation succeeds for each new tool_type."

frontend:
  - task: "Port Scanner page (/tools/port-scan)"
    implemented: true
    working: "NA"
    file: "src/pages/tools/PortScan.js, src/lib/tools.js, src/App.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "Target input, scope toggle (common / common+range), start/end port inputs, case select, results grid of open ports + AI markdown. Not yet tested via automation (awaiting user permission for frontend tests)."

  - task: "IPv4 to IPv6 Converter page (/tools/ipv6-convert)"
    implemented: true
    working: "NA"
    file: "src/pages/tools/IPv6Convert.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "IPv4 input, copyable IPv6 representation cards + markdown. Awaiting frontend test permission."

  - task: "Password Breach Checker page (/tools/breach-check)"
    implemented: true
    working: "NA"
    file: "src/pages/tools/BreachCheck.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "Password input w/ show-hide, breach summary cards + AI advisory. Awaiting frontend test permission."

  - task: "Tools Directory page (/tools-directory) with search + type filter"
    implemented: true
    working: true
    file: "src/pages/ToolsDirectory.js, src/components/AppShell.js"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
        -working: true
        -agent: "main"
        -comment: "Verified visually via screenshot: 32 cards render, search box + type filter chips present, sidebar 'Reference > Tools Directory' nav + dashboard CTA work."

metadata:
  created_by: "main_agent"
  version: "1.1"
  test_sequence: 0
  run_ui: false

test_plan:
  current_focus:
    - "Port Scanner endpoint (POST /api/tools/port-scan)"
    - "IPv4 to IPv6 converter endpoint (POST /api/tools/ipv6-convert)"
    - "Password Breach Checker endpoint (POST /api/tools/breach-check)"
    - "Tools Directory catalog endpoint (GET /api/catalog/tools)"
    - "New tool types in history, stats breakdown, and PDF labels"
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
    -agent: "main"
    -message: |
      Please test ONLY the new backend endpoints (do not retest the 5 pre-existing tools unless needed for history/stats/pdf verification).
      Auth: POST /api/auth/login with {officer_id:"amroha001", password:"cyber@123"} -> use returned access_token as Bearer for all /api/tools/* and /api/catalog/* calls.
      1) POST /api/tools/port-scan: (a) {target:"scanme.nmap.org", mode:"common"} should return 200 with meta.ip, meta.open_ports (expect 22 & 80 open), risk_level set, result_markdown present. (b) {target:"scanme.nmap.org", mode:"common_range", start_port:75, end_port:90} should include the range. (c) invalid host like {target:"thishostdoesnotexist.invalid", mode:"common"} -> 400. (d) bad range (start>end) -> 400.
      2) POST /api/tools/ipv6-convert: {ip:"103.21.58.10"} -> 200 with meta.conversions.ipv4_mapped == "::ffff:103.21.58.10" and sixto4_prefix "2002:6715:3a0a::/48". Invalid {ip:"999.1.1.1"} -> 400. risk_level should be null.
      3) POST /api/tools/breach-check: {password:"password"} -> 200, meta.found true, meta.count large, risk_level "critical" or "high". {password:"<random strong 20-char>"} -> meta.found false, risk_level "clean". IMPORTANT: confirm the saved analysis does NOT store plaintext (GET /api/history/{id} input should only have length+note, not the password).
      4) GET /api/catalog/tools -> 200 with count==32, 4 types, categories list. Confirm 401 without token.
      5) After running tools, GET /api/history should list the new analyses; GET /api/stats tool_breakdown should include port-scan/ipv6-convert/breach-verify counts; GET /api/history/{id}/pdf should return a valid application/pdf for each new tool_type.
      Note: env files were recreated by main agent; backend is running and seeded officer exists.
