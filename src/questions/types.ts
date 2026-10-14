export type Difficulty = "easy" | "medium" | "hard";

export type HashTechnique =
  | "linear-probing"
  | "separate-chaining"
  | "quadratic-probing"
  | "double-hashing";

export type TraversalTechnique = "preorder" | "inorder" | "postorder";

export type HashOperation = "insert" | "delete";

export type HashIteration = {
  operation: HashOperation;
  value: number;
  answer: {
    primaryHash: number;
    targetBucket: number;
    tableAfter: string[];
    explanation?: string;
  };
};

export type HashTableQuestion = {
  schemaVersion: 1;
  id: string;
  type: "hash-table";
  technique: HashTechnique;
  title: string;
  difficulty: Difficulty;
  config: {
    tableSize: number;
    emptyMarker: "";
    deletedMarker: "DEL";
    primaryHash: "key-mod-table-size";
    secondaryHash?: string;
  };
  initialTable: string[];
  iterations: HashIteration[];
};

export type BstTraversalIteration = {
  step: number;
  answer: {
    visitedValue: number;
    explanation?: string;
  };
};

export type BstTraversalQuestion = {
  schemaVersion: 1;
  id: string;
  type: "binary-search-tree";
  technique: TraversalTechnique;
  title: string;
  difficulty: Difficulty;
  tree: {
    construction: "balanced-from-values" | "insert-in-order";
    values: number[];
  };
  iterations: BstTraversalIteration[];
};

export type ImportedQuestion = HashTableQuestion | BstTraversalQuestion;
