const ELEMENT_NODE_TYPE = 1; 
const TEXT_NODE_TYPE = 3; 
var highlightColor = '#fff178'; 

document.addEventListener('DOMContentLoaded', function() {
	// Select all keyword item DOM elements
	var keywordItemEls = document.querySelectorAll('.item-keyword'); 
	var currentActiveItem = null; 
	var paragraphEls = []; 

	window.addEventListener('mouseup', handleWindowMouseUp);
	window.addEventListener('dblclick', handleDoubleClick); 

	// Create a custom temporary node to detect user's click position
	var wrapElName = 'nz-wrap'; 
	var WrapElement = document.registerElement(wrapElName); 

	// Create a custom highlight DOM element
	var highlightElName = 'nz-highlight'; 
	var HighlightElement = document.registerElement(highlightElName); 

	var highlightableClassName = 'nz-highlightable'; 
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
		var anchorNode = selection.anchorNode; 

		// The Node in which the selection ends
		var focusNode = selection.focusNode; 

		// If the user made a selection backwards (from right to left), 
		// switch the anchor and focusNode
		console.log('anchorNode.compareDocumentPosition(focusNode)'); 
		console.log(anchorNode.compareDocumentPosition(focusNode)); 

		if (anchorNode.compareDocumentPosition(focusNode) & Node.DOCUMENT_POSITION_PRECEDING) {
			console.log('preceding'); 
			
			var tempNode = anchorNode; 
			anchorNode = focusNode; 
			focusNode = tempNode; 
		} else if (anchorNode.compareDocumentPosition(focusNode) & Node.DOCUMENT_POSITION_FOLLOWING) {
			console.log('following'); 
		} else {
			console.log('not both'); 
		}

		console.log('anchorNode'); 
		console.log(anchorNode); 

		var beginParagraphEl, beginSpanEl, endParagraphEl, endSpanEl; 

		if (anchorNode.parentNode.nodeName.toLowerCase() === wrapElName.toLowerCase()) {
			beginParagraphEl = anchorNode.parentNode.parentNode; 
			beginSpanEl = anchorNode.parentNode; 
		} else if (anchorNode.parentNode.nodeName === "P") {
			beginParagraphEl = anchorNode.parentNode; 
			beginSpanEl = anchorNode.nextSibling; 
		}

		console.log('beginParagraphEl'); 
		console.log(beginParagraphEl); 
		console.log('beginSpanEl'); 
		console.log(beginSpanEl); 
		
		if (focusNode.parentNode.nodeName.toLowerCase() === wrapElName.toLowerCase()) {
			endParagraphEl = focusNode.parentNode.parentNode; 
			endSpanEl = focusNode.parentNode; 
		} else if (focusNode.parentNode.nodeName === "P") {
			endParagraphEl = focusNode.parentNode; 
			endSpanEl = focusNode.previousSibling; 
		}

		console.log('endParagraphEl'); 
		console.log(endParagraphEl); 
		console.log('endSpanEl'); 
		console.log(endSpanEl); 
		
		// If the user highlighted in a single paragraph
		// Build innerHTML and replace the paragraph's innerHTML
		console.log(beginParagraphEl.childNodes.length); 

		var highlightedInnerHTML
		var isHighlighting = false; 
		var isHighlightComplete = false; 

		// Highlight
		paragraphEls.forEach(function(pEl, pIndex, pEls) {
			if (isHighlightComplete) {
				return;
			}

			highlightedInnerHTML = ''; 

			if (isHighlighting) {
				highlightedInnerHTML += '<' + highlightElName + ' style="background-color: ' + highlightColor + ';">'; 
			}

			pEl.childNodes.forEach(function(el, index, childNodes) {
				if (el === beginSpanEl) {
					console.log('beginSpanEl found'); 
					console.log(el); 
					isHighlighting = true;  
					
					highlightedInnerHTML += '<' + highlightElName + ' style="background-color: ' + highlightColor + ';">'; 
					highlightedInnerHTML += el.innerText; 
				}

				else if (el === endSpanEl) {
					console.log('endSpanEl found'); 
					console.log(el); 
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

			pEl.innerHTML = highlightedInnerHTML; 
		}); // END: paragraphEls.forEach(function(pEl, pIndex, pEls) {}

		console.log('highlightedInnerHTML'); 
		console.log(highlightedInnerHTML); 
		
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

		console.log('activateItem()'); 
		highlightColor = itemEl.dataset.highlightColor; 
		var highlightColorEl = itemEl.querySelector('.highlight-color'); 
		var highlightKeywordEl = itemEl.querySelector('.highlight-keyword'); 
		
		itemEl.classList.add('active'); 
		
		highlightColorEl.style.backgroundColor = ''; 
		highlightKeywordEl.style.backgroundColor = highlightColor; 
	}

	function deactiveItem(itemEl) {
		console.log('deactiveItem()'); 

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