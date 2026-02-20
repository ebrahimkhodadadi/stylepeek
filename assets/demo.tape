# stylepeek full demo
# Run in CI via .github/workflows/vhs.yml (stylepeek is pre-built + linked)
# Run locally: docker run --rm -v $PWD:/vhs ghcr.io/charmbracelet/vhs assets/demo.tape

Output assets/demo.gif

Set FontSize 13
Set Width 1100
Set Height 620
Set Theme "Catppuccin Frappe"
Set WindowBar Colorful
Set WindowBarSize 28
Set Padding 18
Set Framerate 30
Set TypingSpeed 40ms

# ── Clear any noise from terminal startup ──
Hide
Type "clear"
Enter
Show

# ── Show all available commands ──
Sleep 300ms
Type "stylepeek --help"
Enter
Sleep 3500ms

Type "clear"
Enter
Sleep 300ms

# ── List supported export formats ──
Type "stylepeek formats"
Enter
Sleep 2500ms

Type "clear"
Enter
Sleep 300ms

# ── Quick single-page scan (no crawling, depth 0) ──
Type "stylepeek preview https://example.com"
Enter
Wait@90s /Generated|error|Analyzing/
Sleep 4s
