const languages: string[] = [
    "abap", "agda", "arduino", "assembly", "bash", "basic", "bnf", "c", "c#", "c++", "clojure", "coffeescript", "coq", "css", 
    "dart", "dhall", "diff", "docker", "ebnf", "elixir", "elm", "erlang", "f#", "flow", "fortran", "gherkin", "glsl", "go", 
    "graphql", "groovy", "haskell", "html", "idris", "java", "javascript", "json", "julia", "kotlin", "latex", "less", "lisp", 
    "livescript", "llvm ir", "lua", "makefile", "markdown", "markup", "matlab", "mathematica", "mermaid", "nix", "objective-c", 
    "ocaml", "pascal", "perl", "php", "plain text", "powershell", "prolog", "protobuf", "purescript", "python", "r", "racket", 
    "reason", "ruby", "rust", "sass", "scala", "scheme", "scss", "shell", "solidity", "sql", "swift", "toml", "typescript", 
    "vb.net", "verilog", "vhdl", "visual basic", "webassembly", "xml", "yaml"
];

export const parseLanguage = (language: string) => { 
    if(!languages.includes(language)){
        return "javascript"
    }
    return language
}