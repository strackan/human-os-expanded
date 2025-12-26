import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { useMoodData } from '@/hooks/useMoodData';
import CreatableSelect from 'react-select/creatable';

interface LazyMoodSelectorProps {
  value: { value: number; label: string }[];
  onChange: (value: { value: number; label: string }[]) => void;
  onCreateOption?: (inputValue: string) => void;
  placeholder?: string;
  isDisabled?: boolean;
  isMulti?: boolean;
  isClearable?: boolean;
  autoFocus?: boolean;
  onBlur?: () => void;
  className?: string;
  instanceId?: string;
  initialPageSize?: number;
  enableVirtualization?: boolean;
}

export interface LazyMoodSelectorRef {
  refresh: () => void;
}

const LazyMoodSelector = forwardRef<LazyMoodSelectorRef, LazyMoodSelectorProps>(({
  value,
  onChange,
  onCreateOption,
  placeholder = "Select mood(s)...",
  isDisabled = false,
  isMulti = true,
  isClearable = true,
  autoFocus = false,
  onBlur,
  className = "text-sm",
  instanceId,
  initialPageSize = 50,
  enableVirtualization = true
}, ref) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [visibleOptions, setVisibleOptions] = useState<{ value: number; label: string }[]>([]);
  const [showLoadMore, setShowLoadMore] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Use the optimized mood data hook
  const { 
    moods, 
    loadingState, 
    hasMore, 
    loadMore, 
    retry, 
    refresh,
    isLoaded 
  } = useMoodData({
    includePreferences: true,
    includeAnalysis: false,
    showHidden: false,
    sortBy: 'preference',
    limit: enableVirtualization ? initialPageSize : 0,
    enableCache: true
  });

  // Expose refresh method to parent components
  useImperativeHandle(ref, () => ({
    refresh: () => {
      console.log('[LazyMoodSelector] Refresh triggered by parent');
      refresh();
    }
  }), [refresh]);

  // Convert moods to options format
  const allOptions = React.useMemo(() => {
    return moods.map(mood => ({
      value: mood.id,
      label: mood.name || mood.displayName
    }));
  }, [moods]);

  // Filter options based on search query
  const filteredOptions = React.useMemo(() => {
    if (!searchQuery) return allOptions;
    
    const query = searchQuery.toLowerCase();
    return allOptions.filter(option => 
      option.label.toLowerCase().includes(query)
    );
  }, [allOptions, searchQuery]);

  // Initialize visible options
  useEffect(() => {
    if (enableVirtualization) {
      const initialOptions = filteredOptions.slice(0, initialPageSize);
      setVisibleOptions(initialOptions);
      setShowLoadMore(filteredOptions.length > initialPageSize);
    } else {
      setVisibleOptions(filteredOptions);
      setShowLoadMore(false);
    }
  }, [filteredOptions, initialPageSize, enableVirtualization]);

  // Set up intersection observer for lazy loading
  useEffect(() => {
    if (!enableVirtualization || !showLoadMore) return;

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Load more options
          const currentCount = visibleOptions.length;
          const nextBatch = filteredOptions.slice(currentCount, currentCount + initialPageSize);
          
          if (nextBatch.length > 0) {
            setVisibleOptions(prev => [...prev, ...nextBatch]);
            setShowLoadMore(currentCount + nextBatch.length < filteredOptions.length);
          } else {
            setShowLoadMore(false);
          }
        }
      },
      { threshold: 0.5 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [visibleOptions, filteredOptions, initialPageSize, enableVirtualization, showLoadMore]);

  // Handle input change for search
  const handleInputChange = (inputValue: string) => {
    setSearchQuery(inputValue);
  };

  // Handle menu open/close
  const handleMenuOpen = () => {
    setIsMenuOpen(true);
  };

  const handleMenuClose = () => {
    setIsMenuOpen(false);
    setSearchQuery('');
  };

  // Custom components for react-select
  const customComponents = {
    MenuList: ({ children, ...props }: any) => {
      // Filter out React Select specific props to avoid DOM warnings
      const { 
        clearValue, 
        getStyles, 
        getValue, 
        hasValue, 
        isMulti, 
        isRtl, 
        options, 
        selectOption, 
        selectProps, 
        setValue, 
        isDisabled,
        getClassNames,
        innerRef,
        innerProps,
        ...filteredProps 
      } = props;

      return (
        <div {...filteredProps}>
          {children}
          {showLoadMore && (
            <div 
              ref={loadMoreRef}
              className="p-2 text-center text-sm text-gray-500 border-t"
            >
              Loading more options...
            </div>
          )}
          {hasMore && !showLoadMore && (
            <div 
              className="p-2 text-center text-sm text-blue-600 cursor-pointer hover:bg-blue-50 border-t"
              onClick={loadMore}
            >
              Load more moods...
            </div>
          )}
        </div>
      );
    },
    LoadingMessage: ({ ...props }: any) => {
      // Filter out React Select specific props to avoid DOM warnings
      const { 
        clearValue, 
        getStyles, 
        getValue, 
        hasValue, 
        isMulti, 
        isRtl, 
        options, 
        selectOption, 
        selectProps, 
        setValue, 
        isDisabled,
        getClassNames,
        innerRef,
        innerProps,
        ...filteredProps 
      } = props;

      return (
        <div className="p-3 text-center text-gray-500">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto mb-2"></div>
          Loading moods...
        </div>
      );
    },
    NoOptionsMessage: ({ ...props }: any) => {
      // Filter out React Select specific props to avoid DOM warnings
      const { 
        clearValue, 
        getStyles, 
        getValue, 
        hasValue, 
        isMulti, 
        isRtl, 
        options, 
        selectOption, 
        selectProps, 
        setValue, 
        isDisabled,
        getClassNames,
        innerRef,
        innerProps,
        inputValue,
        ...filteredProps 
      } = props;

      return (
        <div className="p-3 text-center text-gray-500">
          {inputValue ? `No moods found matching "${inputValue}"` : 'No moods available'}
          {loadingState.error && (
            <div className="mt-2">
              <button
                onClick={retry}
                className="text-blue-600 hover:text-blue-800 underline text-sm"
              >
                Try again
              </button>
            </div>
          )}
        </div>
      );
    }
  };

  return (
    <CreatableSelect
      inputId={instanceId}
      options={enableVirtualization ? visibleOptions : filteredOptions}
      value={value}
      onChange={onChange}
      onCreateOption={onCreateOption}
      onInputChange={handleInputChange}
      onMenuOpen={handleMenuOpen}
      onMenuClose={handleMenuClose}
      isMulti={isMulti}
      isClearable={isClearable}
      autoFocus={autoFocus}
      onBlur={onBlur}
      placeholder={loadingState.loading ? "Loading moods..." : placeholder}
      formatCreateLabel={(inputValue) => `Create "${inputValue}"`}
      classNamePrefix="react-select"
      className={className}
      instanceId={instanceId}
      isLoading={loadingState.loading}
      isDisabled={isDisabled || loadingState.loading}
      components={customComponents}
      filterOption={() => true} // We handle filtering manually
      loadingMessage={() => null} // We use custom loading message
      noOptionsMessage={({ inputValue }) => null} // We use custom no options message
      menuIsOpen={isMenuOpen}
      styles={{
        menuList: (base) => ({
          ...base,
          maxHeight: '300px',
        }),
        option: (base, state) => ({
          ...base,
          fontSize: '14px',
          padding: '8px 12px',
        }),
        control: (base, state) => ({
          ...base,
          minHeight: '38px',
          fontSize: '14px',
        }),
        placeholder: (base) => ({
          ...base,
          fontSize: '14px',
        }),
      }}
    />
  );
});

LazyMoodSelector.displayName = 'LazyMoodSelector';

export default LazyMoodSelector; 