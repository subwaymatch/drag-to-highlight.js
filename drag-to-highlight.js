function DragToHighlight(contentSelector, options) {

	const ELEMENT_NODE_TYPE = 1;
	const TEXT_NODE_TYPE = 3;

	var _this = this;

	// User-configurable options
	var options = options || {};

	var contentEls;
	var highlightableElements = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote'];
	var highlightColor = '#fff178';
	var wrapElName = 'hl-wrap';								// A custom element to wrap each word in paragraphs to detect user click position
	var highlightElName = 'hl-highlight';					// Class of highlighted element
	var highlightableClassName = 'hl-highlightable';		// Custom class to allow highlighting

	// Stacks used to keep undo/redo history
	var undoHistoryStack = [];
	var redoHistoryStack = [];

	// Register custom elements
	var WrapElement = document.registerElement(wrapElName);
	var HighlightElement = document.registerElement(highlightElName);

	// Paragraph elements
	var paragraphEls = [];


	/**
	 * Initialize the highlighter plug-in
	 */
	var init = function() {
		contentEls = document.querySelectorAll(contentSelector);

		contentEls.forEach(function(contentEl) {
			var contentChildNodes = contentEl.childNodes;

			contentChildNodes.forEach(function (el) {
				if ((el.classList != undefined && el.classList.contains(highlightableClassName)) || (highlightableElements.indexOf(el.nodeName.toLowerCase()) > -1)) {
					paragraphEls.push(el);
					el.innerHTML = wrapAllWordsInElement(el.innerHTML);

					el.addEventListener('click', handleClick);
				}
			});
		});

		attachEventHandlers();
	};


	/**
	 * Attach event handlers
	 */
	var attachEventHandlers = function() {
		window.addEventListener('mouseup', handleWindowMouseUp);
	};


	/**
	 * Wrap all words
	 *
	 * @param html Target DOM element
	 */
	var wrapAllWordsInElement = function(html) {
		return html.replace(/([^\s-.,;:!?()[\]{}<>"]+)/g, '<' + wrapElName + '>$1</' + wrapElName + '>');
	};

	/**
	 * Event handler for mouseup event
	 * mouseup event is fired when user releases a mouse click or drag
	 *
	 * @param e
	 */
	// 1. Get selection
	// 2. Check whether the user has began and ended the highlight in words, or in whitespaces or other chars (dot, semicolon, etc)
	// 3. Highlight
	var handleWindowMouseUp = function() {
		// Get current selection (range to highlight)
		var selection = window.getSelection ? window.getSelection() : document.selection;

		// If no selection has made, do nothing and return
		if (selection.toString().trim() === "") {
			return;
		}

		// The Node in which the selection begins
		var startNode = selection.anchorNode;

		// The Node in which the selection ends
		var endNode = selection.focusNode;

		// If user selected in reverse direction (dragged from right to left), swap start and end node
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

		var highlightedInnerHTML;
		var isHighlighting = false;
		var isHighlightComplete = false;

		var originalStatus = [];

		// Highlight
		paragraphEls.forEach(function (pEl) {
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

			pEl.childNodes.forEach(function (el) {
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

		// Remove selection if highlighting is complete
		if (isHighlightComplete) {
			if (selection.removeAllRanges) {
				selection.removeAllRanges();
			} else if (selection.empty) {
				selection.empty();
			}
		}
	};


	/**
	 * Event handler for click events
	 *
	 * @param e Click event
	 */
	var handleClick = function(e) {
		deleteHighlightedElement(e.target);
	};


	/**
	 * Delete a highlighted element
	 *
	 * @param targetEl Element to unhighlight
	 */
	var deleteHighlightedElement = function(targetEl) {
		if (targetEl && targetEl.nodeName.toLowerCase() == highlightElName) {
			var originalStatus = [];

			originalStatus.push({
				el: targetEl.parentNode,
				html: targetEl.parentNode.innerHTML
			});

			targetEl.insertAdjacentHTML('beforebegin', wrapAllWordsInElement(targetEl.innerHTML));
			targetEl.parentNode.removeChild(targetEl);

			undoHistoryStack.push(originalStatus);
			redoHistoryStack = [];
		}
	};



	/**
	 * Restore changed elements to original state
	 * Used internally to perform undo/redo actions
	 *
	 * @param stateToRestore
	 * @returns {Array}
	 */
	var restore = function(stateToRestore) {
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
	};


	var rgb2hex = function(rgb) {
		rgb = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
		return "#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]);
	};

	var hex = function(x) {
		var hexDigits = ["0","1","2","3","4","5","6","7","8","9","a","b","c","d","e","f"];

		return isNaN(x) ? "00" : hexDigits[(x - x % 16) / 16] + hexDigits[x % 16];
	};



	/**
	 * Undo highlighting action
	 *
	 * If no previous state exists, this function will do nothing
	 */
	_this.undo = function() {
		// If no state exists for undoing, do nothing
		if (undoHistoryStack.length === 0) {
			return;
		}

		var stateToRestore = undoHistoryStack.pop();
		var originalState = restore(stateToRestore);

		redoHistoryStack.push(originalState);
	};


	/**
	 * Redo highlighting action
	 *
	 * If at latest state, do nothing
	 */
	_this.redo = function() {
		// If no state exists for redoing, do nothing
		if (redoHistoryStack.length === 0) {
			return;
		}

		var stateToRestore = redoHistoryStack.pop();
		var originalState = restore(stateToRestore);

		undoHistoryStack.push(originalState);
	};


	/**
	 * Getter for highlighting color
	 *
	 * @returns {string} current highlighting color
	 */
	_this.getColor = function() {
		return highlightColor;
	};


	/**
	 * Setter for highlighting color
	 *
	 * @param newColor new highlighting color
	 */
	_this.setColor = function(newColor) {
		highlightColor = newColor;
	};


	/**
	 * Clear all highlights of specific color
	 *
	 * @param hexColor Target highlight color
	 */
	_this.clearHighlightsByColor = function(hexColor) {
		var allHighlightedEls = document.querySelectorAll(highlightElName);

		allHighlightedEls.forEach(function(el) {
			var highlightedColor = rgb2hex(el.style.backgroundColor);

			if (highlightedColor === hexColor) {
				deleteHighlightedElement(el);
			}

		});

		console.log(allHighlightedEls);
	};


	init();
}