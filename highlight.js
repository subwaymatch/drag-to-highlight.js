const ELEMENT_NODE_TYPE = 1; 
const TEXT_NODE_TYPE = 3; 
var highlightColor = '#fff178'; 

var undoHistoryStack = []; 
var redoHistoryStack = []; 

var globalEl = null; 

document.addEventListener('DOMContentLoaded', function() {
	// Select all keyword item DOM elements
	var keywordItemEls = document.querySelectorAll('.item-keyword'); 
	var currentActiveItem = null; 
	var paragraphEls = []; 

	// Create a custom temporary node to detect user's click position
	const wrapElName = 'hl-wrap'; 
	var WrapElement = document.registerElement(wrapElName); 

	// Create a custom highlight DOM element
	const highlightElName = 'hl-highlight'; 
	var HighlightElement = document.registerElement(highlightElName); 

	const highlightableClassName = 'hl-highlightable'; 
	var highlightableElements = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote']; 

	function init() {
		var contentEl = document.querySelector('#content'); 
		var contentChildNodes = contentEl.childNodes; 

		// Activate the first keyword item
		activateKeyword(keywordItemEls[0]); 

		contentChildNodes.forEach(function(el, index, childNodes) {
			if ((el.classList != undefined && el.classList.contains(highlightableClassName)) || (highlightableElements.indexOf(el.nodeName.toLowerCase()) > -1)) {
				paragraphEls.push(el); 
				wrapAllWordsInElement(el); 
			}
		}); 

		attachEventHandlers(); 
	}

	function attachEventHandlers() {
		window.addEventListener('mouseup', handleWindowMouseUp);
		window.addEventListener('dblclick', handleDoubleClick); 
		window.addEventListener('mousewheel', handleMouseWheel); 
		window.addEventListener('DOMMouseScroll', handleMouseWheel); 

		document.addEventListener('keydown', handleKeyDown); 
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

		var originalStatus = []; 

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
			originalStatus.push({
				el: pEl,
				html: pEl.innerHTML
			});

			// Render
			pEl.innerHTML = highlightedInnerHTML; 
		}); // END: paragraphEls.forEach(function(pEl, pIndex, pEls) {}

		undoHistoryStack.push(originalStatus); 
		redoHistoryStack = []; 

		// Remove selection in caes highlighted
		if (isHighlightComplete) {
			if (selection.removeAllRanges) {
				selection.removeAllRanges(); 
			} else if (selection.empty) {
				selection.empty(); 
			}
		}
	}

	// Handle user mouse wheel scroll
	function handleMouseWheel(e) {
		var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail))); 
		var isDownwards = (delta === -1) ? true : false; 

		switchKeyword(isDownwards); 
	}

	// TODO: handle doubleclick events
	function handleDoubleClick(e) {
		// Prevent text highlight on double click
		e.preventDefault(); 
	}

	function handleKeyDown(e) {
		var evtObj = window.event ? event : e; 

		// Undo
		if (evtObj.ctrlKey) {
			// Undo (ctrl+z)
			if (evtObj.keyCode == 90) {
				undoHighlight(); 
			}

			// Redo (ctrl+y)
			else if (evtObj.keyCode == 89) {
				redoHighlight(); 
			}
			
		}
	}

	// Switch keyword
	function switchKeyword(isDownwards) {
		keywordItemEls;

		if (currentActiveItem === null) {
			activateKeyword(keywordItemEls[0]); 
		}
		
		else {
			var currentIndex = Array.prototype.indexOf.call(keywordItemEls, currentActiveItem); 
			var numKeywords = keywordItemEls.length
			console.log(keywordItemEls.length); 

			if (isDownwards) {
				if (currentIndex == numKeywords - 1) {
					// Do nothing
				}

				else {
					activateKeyword(currentActiveItem.nextElementSibling); 
				}
			}
			
			else {
				if (currentIndex == 0) {
					// Do nothing
				}

				else {
					activateKeyword(currentActiveItem.previousElementSibling); 
				}
			}
		}
	}

	
	function undoHighlight() {
		// If no state exists for undoing, do nothing
		if (undoHistoryStack.length === 0) {
			return ; 
		}

		var stateToRestore = undoHistoryStack.pop(); 
		var originalState = restore(stateToRestore); 

		redoHistoryStack.push(originalState); 
	}

	function redoHighlight() {
		// If no state exists for redoing, do nothing
		if (redoHistoryStack.length === 0) {
			return ; 
		}

		var stateToRestore = redoHistoryStack.pop(); 
		var originalState = restore(stateToRestore); 

		undoHistoryStack.push(originalState); 
	}

	function restore(stateToRestore) {
		var originalState = []; 

		for (var i = 0; i < stateToRestore.length; i++) {
			var status = stateToRestore[i]; 

			originalState.push({
				el: status.el, 
				html: status.el.innerHTML
			});

			status.el.innerHTML = status.html; 
		}

		stateToRestore.html = status.innerHTML; 

		return originalState; 
	}

	function activateKeyword(itemEl) {
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
			activateKeyword(itemEl); 

			e.preventDefault(); 
		}); 
	});

	init(); 
});