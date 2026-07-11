def build_prompt(dataset_profile: dict) -> str:
    system = read("system_prompt.md")
    task = read("task_prompt.md")
    output = read("output_format.md")
    examples = read("examples.md")

    return (
        system
        + "\n\n"
        + task
        + "\n\nDataset Profile:\n"
        + json.dumps(dataset_profile, indent=2)
        + "\n\n"
        + output
        + "\n\n"
        + examples
    )
