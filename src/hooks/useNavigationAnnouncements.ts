import { useCallback } from 'react';
import { useScreenReaderAnnouncements } from './useScreenReaderAnnouncements';

export function useNavigationAnnouncements() {
  const { announce } = useScreenReaderAnnouncements();

  // Page navigation announcements
  const announcePageChange = useCallback(
    (pageName: string, pageDescription?: string
) => {
      let message = `Navigated to ${pageName} page`;
      if (pageDescription) {
        message += `. ${pageDescription}`;
      }
      announce(message, 'polite');
    },
    [announce]
  );

  const announceRouteChange = useCallback(
    (fromRoute: string, toRoute: string
) => {
      announce(`Navigating from ${fromRoute} to ${toRoute}.`, 'polite');
    },
    [announce]
  );

  // Tab navigation announcements
  const announceTabChange = useCallback(
    (tabName: string, tabIndex: number, totalTabs: number, description?: string
) => {
      let message = `${tabName} tab selected. Tab ${tabIndex + 1} of ${totalTabs}`;
      if (description) {
        message += `. ${description}`;
      }
      announce(message, 'polite');
    },
    [announce]
  );

  const announceTabNavigation = useCallback(
    (direction: 'next' | 'previous' | 'first' | 'last', currentTab: string
) => {
      let message = '';
      switch (direction) {
        case 'next':
          message = `Moved to next tab: ${currentTab}`;
          break;
        case 'previous':
          message = `Moved to previous tab: ${currentTab}`;
          break;
        case 'first':
          message = `Moved to first tab: ${currentTab}`;
          break;
        case 'last':
          message = `Moved to last tab: ${currentTab}`;
          break;
      }
      announce(message, 'polite');
    },
    [announce]
  );

  // Section navigation announcements
  const announceSectionChange = useCallback(
    (sectionName: string, sectionDescription?: string
) => {
      let message = `Navigated to ${sectionName} section`;
      if (sectionDescription) {
        message += `. ${sectionDescription}`;
      }
      announce(message, 'polite');
    },
    [announce]
  );

  const announceModalOpen = useCallback(
    (modalName: string, purpose?: string
) => {
      let message = `${modalName} dialog opened`;
      if (purpose) {
        message += ` for ${purpose}`;
      }
      message += '. Press Escape to close.';
      announce(message, 'assertive');
    },
    [announce]
  );

  const announceModalClose = useCallback(
    (modalName: string
) => {
      announce(`${modalName} dialog closed. Returning to main content.`, 'polite');
    },
    [announce]
  );

  // Menu navigation announcements
  const announceMenuOpen = useCallback(
    (menuName: string, itemCount?: number
) => {
      let message = `${menuName} menu opened`;
      if (itemCount) {
        message += ` with ${itemCount} item${itemCount === 1 ? '' : 's'}`;
      }
      message += '. Use arrow keys to navigate, Enter to select, Escape to close.';
      announce(message, 'polite');
    },
    [announce]
  );

  const announceMenuClose = useCallback(
    (menuName: string
) => {
      announce(`${menuName} menu closed.`, 'polite');
    },
    [announce]
  );

  const announceMenuItemFocus = useCallback(
    (itemName: string, itemIndex: number, totalItems: number, description?: string
) => {
      let message = `${itemName}. Item ${itemIndex + 1} of ${totalItems}`;
      if (description) {
        message += `. ${description}`;
      }
      announce(message, 'polite');
    },
    [announce]
  );

  const announceSubmenuOpen = useCallback(
    (submenuName: string, parentMenu: string
) => {
      announce(
        `${submenuName} submenu opened from ${parentMenu}. Use arrow keys to navigate, Escape to return to parent menu.`,
        'polite'
      );
    },
    [announce]
  );

  // Breadcrumb navigation announcements
  const announceBreadcrumbNavigation = useCallback(
    (breadcrumbs: string[], currentIndex: number
) => {
      const breadcrumbPath = breadcrumbs.join(' > ');
      announce(
        `Navigation path: ${breadcrumbPath}. Currently at ${breadcrumbs[currentIndex]}.`,
        'polite'
      );
    },
    [announce]
  );

  const announceBreadcrumbClick = useCallback(
    (targetPage: string, currentPage: string
) => {
      announce(`Navigating from ${currentPage} back to ${targetPage}.`, 'polite');
    },
    [announce]
  );

  // Pagination announcements
  const announcePaginationChange = useCallback(
    (
      currentPage: number,
      totalPages: number,
      itemsPerPage?: number,
      totalItems?: number
    
) => {
      let message = `Page ${currentPage} of ${totalPages}`;
      if (itemsPerPage && totalItems) {
        const startItem = (currentPage - 1) * itemsPerPage + 1;
        const endItem = Math.min(currentPage * itemsPerPage, totalItems);
        message += `. Showing items ${startItem} to ${endItem} of ${totalItems}`;
      }
      announce(message, 'polite');
    },
    [announce]
  );

  const announcePaginationNavigation = useCallback(
    (
      direction: 'next' | 'previous' | 'first' | 'last' | 'jump',
      targetPage?: number
    
) => {
      let message = '';
      switch (direction) {
        case 'next':
          message = 'Moving to next page';
          break;
        case 'previous':
          message = 'Moving to previous page';
          break;
        case 'first':
          message = 'Moving to first page';
          break;
        case 'last':
          message = 'Moving to last page';
          break;
        case 'jump':
          message = `Jumping to page ${targetPage}`;
          break;
      }
      announce(message, 'polite');
    },
    [announce]
  );

  // Scroll and focus announcements
  const announceScrollPosition = useCallback(
    (position: 'top' | 'bottom' | 'middle', elementName?: string
) => {
      let message = '';
      switch (position) {
        case 'top':
          message = 'Scrolled to top';
          break;
        case 'bottom':
          message = 'Scrolled to bottom';
          break;
        case 'middle':
          message = 'Scrolled to middle';
          break;
      }
      if (elementName) {
        message += ` of ${elementName}`;
      }
      announce(message, 'polite');
    },
    [announce]
  );

  const announceFocusChange = useCallback(
    (elementName: string, elementType: string, context?: string
) => {
      let message = `Focus moved to ${elementName} ${elementType}`;
      if (context) {
        message += ` in ${context}`;
      }
      announce(message, 'polite');
    },
    [announce]
  );

  const announceFocusTrap = useCallback(
    (containerName: string
) => {
      announce(
        `Focus is now trapped within ${containerName}. Use Tab and Shift+Tab to navigate, Escape to exit.`,
        'polite'
      );
    },
    [announce]
  );

  const announceFocusReturn = useCallback(
    (elementName: string
) => {
      announce(`Focus returned to ${elementName}.`, 'polite');
    },
    [announce]
  );

  // Search and filter navigation announcements
  const announceSearchNavigation = useCallback(
    (query: string, resultCount: number, currentIndex?: number
) => {
      let message = `Search for "${query}" found ${resultCount} result${resultCount === 1 ? '' : 's'}`;
      if (currentIndex !== undefined && resultCount > 0) {
        message += `. Currently at result ${currentIndex + 1}`;
      }
      announce(message, 'polite');
    },
    [announce]
  );

  const announceFilterChange = useCallback(
    (filterName: string, filterValue: string, resultCount: number
) => {
      announce(
        `Filter "${filterName}" set to "${filterValue}". Showing ${resultCount} result${resultCount === 1 ? '' : 's'}.`,
        'polite'
      );
    },
    [announce]
  );

  const announceSortChange = useCallback(
    (sortBy: string, sortOrder: 'ascending' | 'descending', resultCount: number
) => {
      announce(
        `Content sorted by ${sortBy} in ${sortOrder} order. ${resultCount} item${resultCount === 1 ? '' : 's'} displayed.`,
        'polite'
      );
    },
    [announce]
  );

  // Accordion and collapsible navigation announcements
  const announceAccordionToggle = useCallback(
    (
      sectionName: string,
      isExpanded: boolean,
      sectionIndex?: number,
      totalSections?: number
    
) => {
      let message = `${sectionName} section ${isExpanded ? 'expanded' : 'collapsed'}`;
      if (sectionIndex !== undefined && totalSections !== undefined) {
        message += `. Section ${sectionIndex + 1} of ${totalSections}`;
      }
      announce(message, 'polite');
    },
    [announce]
  );

  const announceCollapsibleToggle = useCallback(
    (elementName: string, isExpanded: boolean
) => {
      announce(`${elementName} ${isExpanded ? 'expanded' : 'collapsed'}.`, 'polite');
    },
    [announce]
  );

  // Carousel and slider navigation announcements
  const announceCarouselNavigation = useCallback(
    (
      direction: 'next' | 'previous',
      currentSlide: number,
      totalSlides: number,
      slideTitle?: string
    
) => {
      let message = `Moved to ${direction} slide. Slide ${currentSlide + 1} of ${totalSlides}`;
      if (slideTitle) {
        message += `: ${slideTitle}`;
      }
      announce(message, 'polite');
    },
    [announce]
  );

  const announceCarouselAutoplay = useCallback(
    (isPlaying: boolean
) => {
      announce(`Carousel autoplay ${isPlaying ? 'started' : 'stopped'}.`, 'polite');
    },
    [announce]
  );

  // Navigation shortcuts and help announcements
  const announceKeyboardShortcuts = useCallback(
    (context: string
) => {
      announce(
        `Keyboard shortcuts available for ${context}. Press F1 or Ctrl+? for help.`,
        'polite'
      );
    },
    [announce]
  );

  const announceNavigationHelp = useCallback(
    (helpText: string
) => {
      announce(`Navigation help: ${helpText}`, 'polite');
    },
    [announce]
  );

  const announceSkipLink = useCallback(
    (targetSection: string
) => {
      announce(`Skipped to ${targetSection} section.`, 'polite');
    },
    [announce]
  );

  return {
    announcePageChange,
    announceRouteChange,
    announceTabChange,
    announceTabNavigation,
    announceSectionChange,
    announceModalOpen,
    announceModalClose,
    announceMenuOpen,
    announceMenuClose,
    announceMenuItemFocus,
    announceSubmenuOpen,
    announceBreadcrumbNavigation,
    announceBreadcrumbClick,
    announcePaginationChange,
    announcePaginationNavigation,
    announceScrollPosition,
    announceFocusChange,
    announceFocusTrap,
    announceFocusReturn,
    announceSearchNavigation,
    announceFilterChange,
    announceSortChange,
    announceAccordionToggle,
    announceCollapsibleToggle,
    announceCarouselNavigation,
    announceCarouselAutoplay,
    announceKeyboardShortcuts,
    announceNavigationHelp,
    announceSkipLink,
  };
}
