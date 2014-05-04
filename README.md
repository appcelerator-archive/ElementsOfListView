# Elements Of ListView

Tutorial: [Elements of ListView.pdf](Elements of ListView.pdf)

ListView is a bit daunting to anybody who hasn’t used it before. Its structure is completely different from TableView or any other Titanium UI element. However, anybody who’s used TableView knows that when a table gets too large, it slows down, it consumes memory, it scrolls in fits and starts, and the device becomes less responsive.

ListView was designed to solve this problem.

The biggest mental hurdle with ListView is that you no longer create the elements the ListView displays, ListView does that for you. Instead of views you have templates, and you provide the data necessary to fill these templates. The ListView controls the views, and recycles them as they roll off the screen, so you never have more views than are visible.

This white paper describes how to handle the data and templates. We start with a basic list using the default template, creating your own template, feeding the ListView with live data, and event handling. When you are done, you’ll be a master of one of the most powerful features of the Titanium SDK.



