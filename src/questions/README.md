# Question imports

This folder is the source of truth for imported practice questions.

## Folder structure

```text
src/questions/
├── imports/     # Converted, app-ready question JSON files
├── examples/    # Reference examples for each supported question type
├── README.md    # Copy-paste format and validation rules
└── types.ts     # TypeScript schema used by the app
```

Questions were previously represented directly in `src/App.tsx`. New question
content should be converted into JSON and saved in `src/questions/imports/`.

## Definition of a question

- One question represents one complete data-structure instance.
- A hash-table question contains one table and its operation sequence.
- A BST traversal question contains one tree and its visit sequence.
- A standard question has exactly 10 iterations.
- Iterations may be insertions, deletions, or a mixture when the technique
  supports those operations.
- Answers are provided explicitly. The importer does not generate answers.

## Easiest copy-paste format

You do not need to write JSON. Copy this template, fill in the content, and
send it in the chat. It will be converted to an app-ready JSON test case.

### Hash table

```text
QUESTION TYPE: Hash table
TECHNIQUE: Linear probing
ID: linear-001
TITLE: Linear probing with mixed operations
DIFFICULTY: Easy

TABLE SIZE: 7
PRIMARY HASH: key mod table size
SECONDARY HASH: Not applicable
EMPTY MARKER: empty string
DELETED MARKER: DEL

INITIAL TABLE:
["", "", "", "", "", "", ""]

ITERATION 1
Operation: Insert
Value: 18
Answer primary hash: 4
Answer target bucket: 4
Answer table after: ["", "", "", "", "18", "", ""]
Explanation: Bucket 4 is empty.

ITERATION 2
Operation: Insert
Value: 25
Answer primary hash: 4
Answer target bucket: 5
Answer table after: ["", "", "", "", "18", "25", ""]
Explanation: Bucket 4 is occupied, so linear probing moves to bucket 5.

[Continue through ITERATION 10]
```

Valid techniques:

- `Linear probing`
- `Separate chaining`
- `Quadratic probing`
- `Double hashing`

For separate chaining, represent a chain with an arrow:

```text
["", "", "", "", "18 → 25 → 32", "", ""]
```

### Binary search tree traversal

```text
QUESTION TYPE: Binary search tree
TECHNIQUE: Preorder
ID: preorder-001
TITLE: Preorder traversal of a balanced tree
DIFFICULTY: Easy

TREE CONSTRUCTION: Balanced from values
TREE VALUES:
[1, 3, 4, 6, 7, 8, 9, 10, 13, 14]

ITERATION 1
Answer visited value: 7
Explanation: Preorder visits the root first.

ITERATION 2
Answer visited value: 3
Explanation: Continue into the left subtree.

[Continue through ITERATION 10]
```

Valid techniques:

- `Preorder`
- `Inorder`
- `Postorder`

Valid tree construction modes:

- `Balanced from values`
- `Insert in order`

## JSON import rules

The converted file must follow the types in `types.ts`.

1. `schemaVersion` must be `1`.
2. `id` must be unique and use lowercase kebab-case.
3. `difficulty` must be `easy`, `medium`, or `hard`.
4. A standard question must contain exactly 10 iterations.
5. A hash table's `initialTable` and every `tableAfter` array must have exactly
   `tableSize` entries.
6. Empty buckets use `""`.
7. Deleted open-addressing buckets use `"DEL"`.
8. Chained values use the exact separator `" → "`.
9. The supplied answer is authoritative and is not recalculated or generated.
10. Explanations are optional but recommended.

See `examples/hash-table.json` and `examples/bst-traversal.json` for complete
machine-readable examples.
