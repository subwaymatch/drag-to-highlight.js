const ELEMENT_NODE_TYPE = 1; 
const TEXT_NODE_TYPE = 3; 
var highlightColor = '#fff178'; 

var highlightHistory = []; 

var globalEl = null; 

document.addEventListener('DOMContentLoaded', function() {
	// Select all keyword item DOM elements
	var keywordItemEls = document.querySelectorAll('.item-keyword'); 
	var currentActiveItem = null; 
	var paragraphEls = []; 

	window.addEventListener('mouseup', handleWindowMouseUp);
	window.addEventListener('dblclick', handleDoubleClick); 
	window.addEventListener('mousewheel', handleMouseWheel); 
	window.addEventListener('DOMMouseScroll', handleMouseWheel); 

	// Controls
	var undoBtnEl = document.getElementById('btn-undo'); 
	var redoBtnEl = document.getElementById('btn-redo'); 
	var nextPageBtnEl = document.getElementById('btn-next'); 
	var previousPageBtnEl = document.getElementById('btn-prev'); 

	// Create a custom temporary node to detect user's click position
	var wrapElName = 'hl-wrap'; 
	var WrapElement = document.registerElement(wrapElName); 

	// Create a custom highlight DOM element
	var highlightElName = 'hl-highlight'; 
	var HighlightElement = document.registerElement(highlightElName); 

	var highlightableClassName = 'hl-highlightable'; 
	var highlightableElements = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote']; 

	function init() {
		var contentEl = document.querySelector('#content'); 
		var contentChildNodes = contentEl.childNodes; 

		contentChildNodes.forEach(function(el, index, childNodes) {
			if ((el.classList != undefined && el.classList.contains(highlightableClassName)) || (highlightableElements.indexOf(el.nodeName.toLowerCase()) > -1)) {
				paragraphEls.push(el); 
				wrapAllWordsInElement(el); 
			}
		}); 

		undoBtnEl.addEventListener('click', function(e) {
			e.preventDefault(); 
			undoHighlight(); 
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

		var highlightAction = []; 

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
			highlightAction.push({
				el: pEl,
				html: pEl.innerHTML
			});
			console.log('p1 type=' + typeof(pEl)); 

			// Render
			pEl.innerHTML = highlightedInnerHTML; 
		}); // END: paragraphEls.forEach(function(pEl, pIndex, pEls) {}

		highlightHistory.push(highlightAction); 

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

		console.log('handleMouseWheel(), delta=' + delta); 

		switchKeyword(isDownwards); 
	}

	function handleDoubleClick(e) {
		console.log('handleDoubleClick'); 

		// Prevent text highlight on double click
		e.preventDefault(); 
	}

	// Switch keyword
	function switchKeyword(isDownwards) {
		keywordItemEls;

		console.log('switchKeyword, isDownwards==' + isDownwards); 
		console.log(currentActiveItem); 

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
		var lastAction = highlightHistory.pop(); 

		for (var i = 0; i < lastAction.length; i++) {
			var action = lastAction[i]; 

			action.el.innerHTML = action.html; 
		}
	}

	function redoHighlight() {

	}

	function activateKeyword(itemEl) {
		console.log('activateKeyword');
		console.log(itemEl); 

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