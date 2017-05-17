const ELEMENT_NODE_TYPE = 1; 
const TEXT_NODE_TYPE = 3; 
var highlightColor = '#fff178'; 

var highlightHistory = []; 

document.addEventListener('DOMContentLoaded', function() {
	// Select all keyword item DOM elements
	var keywordItemEls = document.querySelectorAll('.item-keyword'); 
	var currentActiveItem = null; 
	var paragraphEls = []; 

	window.addEventListener('mouseup', handleWindowMouseUp);
	window.addEventListener('dblclick', handleDoubleClick); 

	// Create a custom temporary node to detect user's click position
	var wrapElName = 'hl-wrap'; 
	var WrapElement = document.registerElement(wrapElName); 

	// Create a custom highlight DOM element
	var highlightElName = 'hl-highlight'; 
	var HighlightElement = document.registerElement(highlightElName); 

	var highlightableClassName = 'hl-highlightable'; 
	var highlightableElements = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote']; 
	
	// A stack of highlight actions for undo/redo
	

	function init() {
		var contentEl = document.querySelector('#content'); 
		var contentChildNodes = contentEl.childNodes; 

		contentChildNodes.forEach(function(el, index, childNodes) {
			if ((el.classList != undefined && el.classList.contains(highlightableClassName)) || (highlightableElements.indexOf(el.nodeName.toLowerCase()) > -1)) {
				paragraphEls.push(el); 
				wrapAllWordsInElement(el); 
			}
		}); 
	}

	function wrapAllWordsInElement(paragraphEl) {
		paragraphEl.innerHTML = paragraphEl.innerHTML.replace(/([^\s-.,;:!?()[\]{}<>"]+)/g,'<' + wrapElName + '>$1</' + wrapElName + '>');
	}

	// 1. Get selection
	// 2. Check whether the user has began and ended the highlight in words, or in whitespaces or other chars (dot, semicolon, etc)
	// 3. Highlight
	function handleWindowMouseUp(e) {
		var selection = window.getSelection ? window.getSelection() : document.selection;

		// If no selection has made, do nothing
		if (selection.toString().trim() == "") {
			return; 
		}

		// Get selection
		console.log(selection); 
		console.log(selection.toString()); 

		// The Node in which the selection begins
		var startNode = selection.anchorNode; 

		// The Node in which the selection ends
		var endNode = selection.focusNode; 

		// If user selected in reverse direction, swap start and end node
		if (startNode.compareDocumentPosition(endNode) & Node.DOCUMENT_POSITION_PRECEDING) {
			var tempNode = startNode; 
			startNode = endNode; 
			endNode = tempNode; 
		}

		var beginParagraphEl, beginSpanEl, endParagraphEl, endSpanEl; 

		if (startNode.parentNode.nodeName.toLowerCase() === wrapElName.toLowerCase()) {
			beginParagraphEl = startNode.parentNode.parentNode; 
			beginSpanEl = startNode.parentNode; 
		} else if (startNode.parentNode.nodeName === "P") {
			beginParagraphEl = startNode.parentNode; 
			beginSpanEl = startNode.nextSibling; 
		}

		if (endNode.parentNode.nodeName.toLowerCase() === wrapElName.toLowerCase()) {
			endParagraphEl = endNode.parentNode.parentNode; 
			endSpanEl = endNode.parentNode; 
		} else if (endNode.parentNode.nodeName === "P") {
			endParagraphEl = endNode.parentNode; 
			endSpanEl = endNode.previousSibling; 
		}

		var highlightedInnerHTML
		var isHighlighting = false; 
		var isHighlightComplete = false; 

		var highlightAction = {}; 

		// Highlight
		paragraphEls.forEach(function(pEl, pIndex, pEls) {
			// If highlighting is complete
			// or highlighting hasn't started but we haven't reached the beginning paragraph, 
			// do nothing and skip iteration
			if (isHighlightComplete || (!isHighlighting && (pEl !== beginParagraphEl))) {
				return;
			}

			highlightedInnerHTML = ''; 

			if (isHighlighting) {
				highlightedInnerHTML += '<' + highlightElName + ' style="background-color: ' + highlightColor + ';">'; 
			}

			pEl.childNodes.forEach(function(el, index, childNodes) {
				if (el === beginSpanEl) {
					isHighlighting = true;  
					
					highlightedInnerHTML += '<' + highlightElName + ' style="background-color: ' + highlightColor + ';">'; 
					highlightedInnerHTML += el.innerText; 
				}

				else if (el === endSpanEl) {
					isHighlighting = false; 
					isHighlightComplete = true; 

					highlightedInnerHTML += el.innerText + '</' + highlightElName + '>'; 
				}

				else if (isHighlighting) {
					if (el.nodeType === ELEMENT_NODE_TYPE) {
						highlightedInnerHTML += el.innerText; 
					} else if (el.nodeType === TEXT_NODE_TYPE) {
						highlightedInnerHTML += el.nodeValue; 
					}
				}

				else if (!isHighlighting) {
					if (el.nodeName.toLowerCase() === highlightElName) {
						highlightedInnerHTML += el.outerHTML; 
					}
					else if (el.nodeType === ELEMENT_NODE_TYPE) {
						highlightedInnerHTML += el.outerHTML; 
					} else if (el.nodeType === TEXT_NODE_TYPE) {
						highlightedInnerHTML += el.nodeValue; 
					}
				}
			}); // END: pEl.childNodes.forEach(function(el, index, childNodes) {}

			if (isHighlighting) {
				highlightedInnerHTML += '</' + highlightElName + '>';
			}
			
			// Save a patch to highlight history
			highlightAction[pEl] = JsDiff.diffWordsWithSpace(highlightedInnerHTML, pEl.innerHTML);

			// Render
			pEl.innerHTML = highlightedInnerHTML; 
		}); // END: paragraphEls.forEach(function(pEl, pIndex, pEls) {}

		highlightHistory.push(highlightAction); 

		setTimeout(function() {
			var lastAction = highlightHistory.pop(); 

			console.log('lastAction'); 
			console.log(lastAction); 

			for (var changedEl in lastAction) {
				if (!lastAction.hasOwnProperty(changedEl)) return;  

				console.log(changedEl); 
				var restoredHTML = ''; 

				var changedObjs = lastAction[changedEl]; 

				for (var i = 0; i < changedObjs.length; i++) {
					restoredHTML = JsDiff.applyPatch(changedEl.innerHTML, changedObjs[i]); 
				}

				changedEl.innerHTML = restoredHTML; 
			}
		}, 1000);
		
		
		// Remove selection in caes highlighted
		if (isHighlightComplete) {
			if (selection.removeAllRanges) {
				selection.removeAllRanges(); 
			} else if (selection.empty) {
				selection.empty(); 
			}
		}
	}


	function handleDoubleClick(e) {
		console.log('handleDoubleClick'); 

		// Prevent text highlight on double click
		e.preventDefault(); 
	}

	function activateItem(itemEl) {
		// If item is already active, do nothing
		if (currentActiveItem == itemEl) {
			return; 
		}

		if (currentActiveItem) {
			deactiveItem(currentActiveItem); 
		}
		currentActiveItem = itemEl; 

		highlightColor = itemEl.dataset.highlightColor; 
		var highlightColorEl = itemEl.querySelector('.highlight-color'); 
		var highlightKeywordEl = itemEl.querySelector('.highlight-keyword'); 
		
		itemEl.classList.add('active'); 
		
		highlightColorEl.style.backgroundColor = ''; 
		highlightKeywordEl.style.backgroundColor = highlightColor; 
	}

	function deactiveItem(itemEl) {
		var highlightColor = itemEl.dataset.highlightColor; 
		var highlightColorEl = itemEl.querySelector('.highlight-color'); 
		var highlightKeywordEl = itemEl.querySelector('.highlight-keyword');

		highlightColorEl.style.backgroundColor = highlightColor; 
		itemEl.classList.remove('active'); 
		highlightKeywordEl.style.backgroundColor = ''; 

	}

	keywordItemEls.forEach(function(itemEl, index, itemEls) {
		// Initialize and create color
		var highlightColor = itemEl.dataset.highlightColor; 
		var highlightColorEl = itemEl.querySelector('.highlight-color'); 

		highlightColorEl.style.backgroundColor = highlightColor; 

		itemEl.addEventListener('click', function(e) {
			activateItem(itemEl); 

			e.preventDefault(); 
		}); 
	});

	init(); 
});