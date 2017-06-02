var runHighlightApp = function() {
	// Select all keyword item DOM elements
	var keywordItemEls = document.querySelectorAll('.item-keyword');
	var currentActiveItem = null;
	var pageEls = null;
	var paginationListEl = null;
	var currentPageIndex = null;
	var highlighter;

	var init = function() {
		generatePages();
		attachEventHandlers();

		var allPageEls = document.querySelectorAll('.page');

		highlighter = new DragToHighlight(allPageEls, {});

		// Activate the first keyword item
		activateKeyword(keywordItemEls[0]);
	};

	var attachEventHandlers = function() {
		window.addEventListener('mousewheel', handleMouseWheel);
		window.addEventListener('DOMMouseScroll', handleMouseWheel);

		document.addEventListener('keydown', handleKeyDown);
	};

	// Handle user mouse wheel scroll
	// TODO: let user set sensitivity since Mac's touchbar's sensitivity is much different from a regular mouse
	var handleMouseWheel = function(e) {
		var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
		var isDownwards = (delta === -1) ? true : false;

		switchKeyword(isDownwards);
	};

	var handleKeyDown = function(e) {
		var evtObj = window.event ? event : e;
		console.log('keyCode: ' + evtObj.keyCode);

		// Keypress event's metaKey property refers to
		// a Mac's command (Apple) key
		if (evtObj.metaKey || evtObj.ctrlKey) {
			// Undo (ctrl+z)
			if (evtObj.keyCode === 90) {
				highlighter.undo();
			}

			// Redo (ctrl+y)
			else if (evtObj.keyCode === 89) {
				highlighter.redo();
			}
		}

		else {
			// Left arrow key
			if (evtObj.keyCode === 37 || evtObj.keyCode === 33) {
				moveToPrevPage();
			}

			// Right arrow key
			else if (evtObj.keyCode === 39 || evtObj.keyCode === 34) {
				moveToNextPage();
			}
		}
	};

	var generatePages = function() {
		pageEls = document.querySelectorAll('#content .page');
		paginationListEl = document.querySelector('#list-pagination');

		if (pageEls.length > 0) {
			pageEls.forEach(function(pageEl, index) {
				var newListItemElement = document.createElement('LI');
				newListItemElement.innerHTML = index + 1;
				newListItemElement.dataset.index = index;

				newListItemElement.addEventListener('click', function() {
					activatePage(index);
				});

				paginationListEl.appendChild(newListItemElement);

				pageEl.style.display = 'none';
			});

			activatePage(0);
		}
	};

	var moveToNextPage = function() {
		console.log('moveToNextPage()');

		if (currentPageIndex < pageEls.length - 1) {
			activatePage(currentPageIndex + 1);
		}
	};

	var moveToPrevPage = function() {
		console.log('moveToPrevPage()');

		if (currentPageIndex > 0) {
			activatePage(currentPageIndex - 1);
		}
	};

	var activatePage = function(newPageIndex) {
		// If user attempts to activate already active page, do nothing and return
		if (newPageIndex === currentPageIndex) {
			return;
		}

		var pageListEls = paginationListEl.querySelectorAll('li');

		if (currentPageIndex !== null) {
			pageEls[currentPageIndex].style.display = 'none';
			pageListEls[currentPageIndex].classList.remove('active');
		}

		pageEls[newPageIndex].style.display = 'block';
		pageListEls[newPageIndex].classList.add('active');

		currentPageIndex = newPageIndex;
	};

	// Switch keyword
	var switchKeyword = function(isDownwards) {
		keywordItemEls;

		if (currentActiveItem === null) {
			activateKeyword(keywordItemEls[0]);
		}

		else {
			var currentIndex = Array.prototype.indexOf.call(keywordItemEls, currentActiveItem);
			var numKeywords = keywordItemEls.length;

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
	};


	var activateKeyword = function(itemEl) {
		// If item is already active, do nothing
		if (currentActiveItem == itemEl) {
			return;
		}

		if (currentActiveItem) {
			deactiveItem(currentActiveItem);
		}

		currentActiveItem = itemEl;

		highlightColor = itemEl.dataset.highlightColor;

		highlighter.setColor(highlightColor);

		var highlightKeywordEl = itemEl.querySelector('.highlight-keyword');

		itemEl.classList.add('active');

		highlightKeywordEl.style.backgroundColor = highlightColor;
	};

	var deactiveItem = function(itemEl) {
		var highlightColor = itemEl.dataset.highlightColor;
		var highlightColorEl = itemEl.querySelector('.highlight-color');
		var highlightKeywordEl = itemEl.querySelector('.highlight-keyword');

		highlightColorEl.style.backgroundColor = highlightColor;
		itemEl.classList.remove('active');
		highlightKeywordEl.style.backgroundColor = '';

	};

	keywordItemEls.forEach(function (itemEl, index, itemEls) {
		// Initialize and create color
		var highlightColor = itemEl.dataset.highlightColor;
		var highlightColorEl = itemEl.querySelector('.highlight-color');

		highlightColorEl.style.backgroundColor = highlightColor;

		itemEl.addEventListener('click', function (e) {
			activateKeyword(itemEl);

			e.preventDefault();
		});
	});

	init();
};

document.addEventListener('DOMContentLoaded', function() {
	runHighlightApp();
});