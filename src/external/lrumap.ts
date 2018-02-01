/**
 * This is a copy of js-lru
 * 	https://github.com/rsms/js-lru
 *
 * I had trouble to make it work with rollup correctly so I copied it and did the tree shaking myself.
 *
 * TODO use js-lru as dependency correctly. Maybe PR a TS version ?
 */


/**
 * A doubly linked list-based Least Recently Used (LRU) cache. Will keep most
 * recently used items while discarding least recently used items when its limit
 * is reached.
 *
 * Licensed under MIT. Copyright (c) 2010 Rasmus Andersson <http://hunch.se/>
 * See README.md for details.
 *
 * Illustration of the design:
 *
 *       entry             entry             entry             entry
 *       ______            ______            ______            ______
 *      | head |.newer => |      |.newer => |      |.newer => | tail |
 *      |  A   |          |  B   |          |  C   |          |  D   |
 *      |______| <= older.|______| <= older.|______| <= older.|______|
 *
 *  removed  <--  <--  <--  <--  <--  <--  <--  <--  <--  <--  <--  added
 */

export interface Entry<K, V> {
	key: K;
	value: V;
}


class EntryImpl<T, R> implements Entry<T, R> {

	newer?: EntryImpl<T, R>;
	older?: EntryImpl<T, R>;

	constructor(public key: T, public value: R) { }
}

export class LRUMap<K, V> {
	size = 0;

	private oldest?: EntryImpl<K, V>;
	private newest?: EntryImpl<K, V>;

	private _keymap = new Map<K, EntryImpl<K, V>>();

	constructor(private limit = 0) { }

	get(key: K) {
		// First, find our cache entry
		const entry = this._keymap.get(key);
		if (entry === undefined) return; // Not cached. Sorry.
		// As <key> was found in the cache, register it as being requested recently
		this.markEntryAsUsed(entry);
		return entry.value;
	}

	set(key: K, value: V) {
		let entry = this._keymap.get(key);

		if (entry !== undefined) {
			// update existing
			entry.value = value;
			this.markEntryAsUsed(entry);
			return this;
		}

		// new entry
		this._keymap.set(key, (entry = new EntryImpl(key, value)));

		if (this.newest !== undefined) {
			// link previous tail to the new tail (entry)
			this.newest.newer = entry;
			entry.older = this.newest;
		} else {
			// we're first in -- yay
			this.oldest = entry;
		}

		// add new entry to the end of the linked list -- it's now the freshest entry.
		this.newest = entry;
		++this.size;
		if (this.size > this.limit) {
			// we hit the limit -- remove the head
			this.shift();
		}

		return this;
	}

	shift() {
		// todo: handle special case when limit == 1
		const entry = this.oldest;
		if (entry !== undefined) {
			if (entry.newer !== undefined) {
				// advance the list
				this.oldest = entry.newer;
				this.oldest.older = undefined;
			} else {
				// the cache is exhausted
				this.oldest = undefined;
				this.newest = undefined;
			}
			// Remove last strong reference to <entry> and remove links from the purged
			// entry being returned:
			entry.newer = entry.older = undefined;
			this._keymap.delete(entry.key);
			--this.size;
			return [entry.key, entry.value] as [K, V];
		}
	}

	delete(key: K) {
		const entry = this._keymap.get(key);
		if (!entry) return;
		this._keymap.delete(entry.key);

		if (entry.newer !== undefined && entry.older !== undefined) {
			// relink the older entry with the newer entry
			entry.older.newer = entry.newer;
			entry.newer.older = entry.older;
		} else if (entry.newer !== undefined) {
			// remove the link to us
			entry.newer.older = undefined;
			// link the newer entry to head
			this.oldest = entry.newer;
		} else if (entry.older !== undefined) {
			// remove the link to us
			entry.older.newer = undefined;
			// link the newer entry to head
			this.newest = entry.older;
		} else {// if(entry.older === undefined && entry.newer === undefined) {
			this.oldest = this.newest = undefined;
		}

		this.size--;
		return entry.value;
	}

	private markEntryAsUsed(entry: EntryImpl<K, V>) {
		if (entry === this.newest) {
			// Already the most recenlty used entry, so no need to update the list
			return;
		}
		// HEAD--------------TAIL
		//   <.older   .newer>
		//  <--- add direction --
		//   A  B  C  <D>  E
		if (entry.newer !== undefined) {
			if (entry === this.oldest) {
				this.oldest = entry.newer;
			}
			entry.newer.older = entry.older; // C <-- E.
		}
		if (entry.older) {
			entry.older.newer = entry.newer; // C. --> E
		}
		entry.newer = undefined; // D --x
		entry.older = this.newest; // D. --> E
		if (this.newest !== undefined) {
			this.newest.newer = entry; // E. <-- D
		}
		this.newest = entry;
	}
}
