# MeritAI ChatGPT app foundation

Tracks #43; coordinate with goals dashboard PR #42. This PR adds the private activity ledger, not a deployed MCP server.

## User experience
Open MeritAI inside ChatGPT, authenticate to the existing MeritAI account, render an interactive goals dashboard, and save explicit notes, progress and outreach drafts to the same profile used by the web app. Show saved timestamps and links; never claim a write succeeded until the API confirms it. No automatic capture of entire chats.

## Next implementation
- Authenticated remote MCP endpoint with OAuth discovery and token validation; derive user identity from validated credentials, never tool arguments. Use user-scoped Supabase access, not service-role bypass.
- Read tools: get_profile, list_goals, get_progress, list_activity, list_outreach.
- Write tools: save_note, log_progress, create_outreach_draft, record_manual_send. Require request UUID for idempotency; resolve goal ownership server-side. Keep canonical goal metrics in the goals system, not just notes; update atomically with activity.
- Apps SDK resource: interactive dashboard with goal cards, progress history, recent notes, and outreach review. Refresh after successful writes; render empty/error states. Verify current SDK resource metadata and OAuth requirements against official documentation before implementing.
- LinkedIn: direct send only with verified authorized API and explicit user approval; otherwise open profile/copy draft and record user-confirmed manual send.
- Provide export/deletion, privacy policy, support and account unlinking; no private profile data in source control.
- Test two-user isolation, anonymous denial, duplicate requests, invalid goal references, token expiry, UI refresh and staging end-to-end. Apply SQL migration once via controlled migration workflow. Test developer connection before public app submission.
