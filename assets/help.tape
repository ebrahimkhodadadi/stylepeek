# stylepeek help + formats demo
# Runs in CI via .github/workflows/vhs.yml (stylepeek is pre-built + linked)
# Run locally: docker run --rm -v $PWD:/vhs ghcr.io/charmbracelet/vhs assets/help.tape

Output assets/help.gif

Set FontSize 13
Set Width 1100
Set Height 440
Set Theme "Catppuccin Frappe"
Set WindowBar Colorful
Set WindowBarSize 28
Set Padding 18
Set Framerate 30
Set TypingSpeed 40ms

Hide
Type "clear"
Enter
Show

Sleep 300ms
Type "stylepeek --help"
Enter
Sleep 3500ms

Type "clear"
Enter
Sleep 400ms

Type "stylepeek formats"
Enter
Sleep 3000ms
