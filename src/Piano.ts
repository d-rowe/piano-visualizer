import {ColorSource, Container, Graphics} from 'pixi.js';
import Layout from './Layout';
import Pitch from './Pitch';

type Config = {
    container: Container;
    backgroundColor?: ColorSource;
    layout: Layout;
}

type ActiveKey = {
    color: string;
    midi: number;
    identifier?: string;
}

export default class Piano {
    private config: Config;
    private container: Container;
    private graphics: Graphics[];
    private layout: Layout;
    private activeKeys: Map<number, ActiveKey[]> = new Map();

    constructor(config: Config) {
        this.config = config;
        this.container = new Container();
        this.layout = config.layout;
        this.graphics = Array.from({length: 89}, () => new Graphics());
        this.render();
    }

    public keyDown(midi: number, color: string, identifier?: string) {
        if (!this.activeKeys.has(midi)) {
            this.activeKeys.set(midi, []);
        }

        this.activeKeys.get(midi)!.push({
            color,
            midi,
            identifier,
        });
    }

    public keyUp(midi: number, identifier?: string) {
        const existingEntries = this.activeKeys.get(midi);
        if (!existingEntries) {
            return;
        }

        if (!identifier) {
            if (existingEntries.length === 1) {
                this.activeKeys.delete(midi);
                return;
            }

            this.activeKeys.get(midi)!.pop();
        }

        const newActiveKeys = this.activeKeys.get(midi)?.filter(
            activeKey => activeKey.identifier !== identifier);
        if (!newActiveKeys?.length) {
            this.activeKeys.delete(midi);
            return;
        }

        this.activeKeys.set(midi, newActiveKeys);
    }

    public render() {
        const prevKeyContainer = this.container;

        this.container = new Container();
        const naturalContainer = new Container();
        const accidentalContainer = new Container();

        for (let midi = 0; midi < 88; midi++) {
            const pitch = new Pitch(midi);
            const keyGraphic = this.createKeyGraphic(pitch);
            this.graphics[midi] = keyGraphic;
            const targetContainer = pitch.isNatural ? naturalContainer : accidentalContainer;
            targetContainer.addChild(keyGraphic);
        }

        this.container.addChild(naturalContainer);
        this.container.addChild(accidentalContainer);
        this.config.container.removeChild(prevKeyContainer);
        this.config.container.addChild(this.container);
        this.container.y = this.layout.getPianoY();
    }

    private createKeyGraphic(pitch: Pitch) {
        const keyElement = this.layout.getKeyElement(pitch.midi);
        const radius = 4;
        const graphic = this.graphics[pitch.midi];
        const activeKeys = this.activeKeys.get(pitch.midi);
        const activeKey = activeKeys?.[activeKeys.length - 1];
        const color = activeKey?.color;
        graphic.clear();

        if (pitch.isNatural) {
            return graphic
                .roundRect(keyElement.x, 0, keyElement.width, keyElement.height, radius)
                .fill(color ?? 'white')
                .stroke('black');
        }

        const shadowMargin = color ? 2 : 4;
        const shadowHeight = color
            ? keyElement.height - shadowMargin * 2
            : keyElement.height / 1.0625;
        return graphic
            .roundRect(keyElement.x, 0, keyElement.width, keyElement.height, radius)
            .fill('black')
            .roundRect(
                keyElement.x + shadowMargin,
                0,
                keyElement.width - shadowMargin * 2,
                shadowHeight,
                radius * 1.5
            ).fill(color ?? '#424242');
    }
}
