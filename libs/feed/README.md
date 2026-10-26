# feed

Feeds users add by URL. A feed starts as a request; the channels worker finds the actual feed at the URL, creates a channel account for it and activates the feed, which subscribes everyone who asked for it.

Run `nx test feed` to execute its unit tests.
