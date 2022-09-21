%lex

%%

\s*\#[^\n\r]*               /* skip line comments */
\s+                         /* skip whitespace */

";"                         return "LINE_END";
"("                         return "(";
")"                         return ")";
">"                         return ">";
"<"                         return "<";
"-"                         return "-";
"*"                         return "*";

[A-Za-z_$][A-Za-z0-9_$]*    return "IDENT";

/lex

%{

const utils = require("./utils");

%}

%%
start
    : rules { return utils.mergeRules($1); }
    ;
rules
    : rules rule -> [...$1, utils.unpackRuleStmt($2)]
    | rule -> [utils.unpackRuleStmt($1)]
    ;
rule
    : LINE_END -> []
    | rule_transitions state LINE_END -> [...$1, $2]
    | IDENT LINE_END -> [{ type: "state", name: $1}, { direction: "r", name: "$$SELF"}, { type: "state", name: $1}]
    ;
rule_transitions
    : rule_transitions rule_transition -> [...$1, ...$2]
    | rule_transition
    ;
rule_transition
    : state transition -> [$1, { type: "transition", ...$2 }]
    ;
state
    : "(" IDENT ")" -> { type: "state", name: $2, initial: true }
    | IDENT -> { type: "state", name: $1 }
    | "*" -> { type: "state", name: "*" }
    ;
transition
    : "<" IDENT ">" -> { direction: "lr", name: $2 }
    | "<" IDENT "-" -> { direction: "l", name: $2 }
    | "-" IDENT ">" -> { direction: "r", name: $2 }
    ;
