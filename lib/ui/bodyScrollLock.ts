type ScrollLockDocument = {
    body: {
        style: {
            overflow: string;
        };
    };
};

type ScrollLockState = {
    count: number;
    previousOverflow: string;
};

const scrollLocks = new WeakMap<ScrollLockDocument, ScrollLockState>();

export function lockBodyScroll(documentLike: ScrollLockDocument = document): () => void {
    let state = scrollLocks.get(documentLike);

    if (!state) {
        state = {
            count: 0,
            previousOverflow: documentLike.body.style.overflow,
        };
        scrollLocks.set(documentLike, state);
        documentLike.body.style.overflow = 'hidden';
    }

    state.count += 1;
    let released = false;

    return () => {
        if (released) return;
        released = true;
        state.count -= 1;

        if (state.count === 0) {
            documentLike.body.style.overflow = state.previousOverflow;
            scrollLocks.delete(documentLike);
        }
    };
}
