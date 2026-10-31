# Note: Live pages keep their picker

Status: implemented

## Problem

The live proxy injected the picker into an HTML response, but two ordinary page
behaviours could make that injection ineffective after the first response. An
absolute redirect to the same development server left the proxy origin, so the
next page had no picker. A document-level CSP meta tag could also reject the
picker even though the proxy removed the equivalent response header.

## Decision

The proxy rewrites a redirect to the target's own origin onto the proxy origin,
preserving path, query and hash. It leaves redirects to other origins untouched.
Before injecting the picker, the proxy removes CSP and CSP-Report-Only meta tags
from the buffered HTML, matching the policy already applied to response headers.

## Alternatives considered

- **Follow the redirect inside the Host** — turns the proxy into a generic
  redirect client and still leaves the browser navigating outside the proxy when
  the response is finally handed back.
- **Inject through a service worker** — requires a second stable origin and a
  larger lifecycle than a one-page proxy, without solving document CSP metas.
- **Let pages keep document-level CSP** — makes element annotation silently
  unavailable on pages whose header policy was already removed by the proxy.

## Consequences

Same-origin login flows and route redirects keep the element picker. Documents
that use CSP meta tags lose that meta policy inside the live annotation frame;
the proxy remains restricted to loopback HTTP, and the frame is the existing
isolated annotation surface. Redirects to a different origin still leave the
proxy and therefore remain outside the annotation chrome.
