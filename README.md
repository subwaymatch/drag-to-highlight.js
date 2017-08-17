# drag-to-highlight.js
A library to support user highlighting while reading on the browser

![Screenshot](http://g.recordit.co/cFQJq5DjsE.gif)

## Demo
http://letter.is/
<br><br>
## Basic Usage
```javascript
// Create a new highlighter instance on <div id="content"></div>
var highlighter = new DragToHighlight('#content'); 
```
<br><br>
## Default options
```javascript
var highlighter = new DragToHighlight('#content', {
  enableKeyboardCtrls: true,                    // Enable ctrl+z(or cmd+z), ctrl+y(or cmd+y) for undo/redo 
  enableEraseByClick: true,                     // Click highlighted section to delete
  highlightElName: 'hl-highlight',              // DOM selector for highlighted elements
  highlightableClassName: 'hl-highlightable'.   // DOM selector for custom higlightable classes
  highlightableElements: ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote']
});
```
<br><br>
## API
```javascript
var highlighter = new DragToHighlight('#content'); 

// Change color
highlighter.setColor('#ff1788'); 

// Get current highligh color
// returns '#ff1788'
highlighter.getColor(); 

// Undo
highlighter.undo(); 

// Redo
highlighter.redo(); 

// Get highlighted HTML
highlighter.getHTML(); 

// Remove all highlights
highlighter.clean(); 

// Remove highlights by color
highlighter.clearHighlightsByColor('#ff1788'); 
```
