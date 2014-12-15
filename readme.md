# nzScrollbar
An amazingly simple scroll replacement for Angular!

## [Demo](http://codepen.io/tannerlinsley/pen/Eaxmwz)

## Install
1. `bower install nz-scrollbar`
2. Include files in your app
  1. `nzScrollbar.js`
	2. `nzScrollbar.css`
3. Include `nzScrollbar` as a dependency (i.e. in `app.js`)
4. Use `nzScrollbar` on any element to make it's contents scrollable!

Like so:
```html
<div nz-scrollbar>
    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore...
</div>
```

To use css top:offset instead of transform:translate():
```html
<div nz-scrollbar use-css-translate="false">
    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore...
</div>
```

Happy Scrolling!
