# drag-to-drag-to-highlight.js
A library to support user highlighting while reading on the browser

<br><br>
# Usage (in progress)
```
// Create a new highlighter instance on <div id="content"></div>
var highlighter = new DragToHighlight('#content'); 

// Change color
highlighter.setColor('#ff1788'); 

// Undo
highlighter.undo(); 

// Redo
highlighter.redo(); 

// Get highlighted HTML
highlighter.getHTML(); 

// Remove all highlights
highlighter.clean(); 
```
