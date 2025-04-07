import { OnInit, History, GUI, Button, Dependency, System, Studio } from "@rbxts/comet";
import { make } from "@rbxts/neomake";
import { Lighting } from "@rbxts/services";

@System()
export class MainSystem implements OnInit {
	private studio = Dependency(Studio);
	private history = Dependency(History);
	private gui = Dependency(GUI);

	public button: Button;

	constructor() {
		this.button = this.gui.createButton(
			"Generate",
			"Generate the types for the selected instance instance.",
			"rbxassetid://109597267415448",
			false,
			true
		);

		this.studio.onSelectionChanged((list) => {
			this.button.setEnabled(list.size() > 0);
		});

		this.button.setEnabled(this.studio.getSelection().size() > 0);
	}

	private buildType(instance: Instance, indentLevel: number = 1): string {
		const indent = "\t".rep(indentLevel);
		let typeDefinition: string = "";

		for (const child of instance.GetChildren()) {
			const className = child.ClassName.gsub(" ", "")[0];
			const childType = this.buildType(child, indentLevel + 1);

			if (childType !== "") {
				typeDefinition += `${indent}["${child.Name}"]: ${className} & {\n${childType}${indent}},\n`;
			} else {
				typeDefinition += `${indent}["${child.Name}"]: ${className},\n`;
			}
		}

		return typeDefinition;
	}

	// Will be initialized after exampleSystem
	public onInit() {
		this.button.onPress(() => {
			const selection = this.studio.getSelection()[0];
			if (!selection) {
				warn("[TypeGen] No instance selected!");
				return;
			}

			print(`[TypeGen] Generating types for ${selection.Name}...`);

			this.history
				.try("Create Definitions", () => {
					const source = make("ModuleScript", {
						Parent: Lighting,
						Name: `${selection.Name}`,
						Source: `export type ${selection.Name} = {\n${this.buildType(selection)}} & ${selection.ClassName}`
					});

					this.studio.openScript(source);
					return source;
				})
				.then((ref) => print(`[TypeGen] Generated ${ref.Name} types in ${ref.Parent}.`))
				.catch((err) => warn(`[TypeGen] Failed to generate types: ${err}`));
		});
	}
}
