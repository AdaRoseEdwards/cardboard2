'use strict';
const textSprite = require('./textSprite');
const EventEmitter = require('fast-event-emitter');
const util = require('util');

/*global THREE*/

module.exports = function GoTargetConfig(three, physics, config) {
	const map = THREE.ImageUtils.loadTexture( "images/reticule.png" );
	const material = new THREE.SpriteMaterial( { map: map, color: 0xffffff, fog: false, transparent: true } );

	function GoTarget(config, node) {

		EventEmitter.call(this);
		const tSprite = new THREE.Sprite(material);
		const id = config.id;

		node.add(tSprite);
		tSprite.scale.set(node.scale.x, node.scale.y, node.scale.z);
		tSprite.name = id;
		node.name = id + '_anchor';
		if (config.text) {
			this.textSprite = textSprite(config.text, {
				fontsize: 18,
				fontface: 'Iceland',
				borderThickness: 20
			});
			this.textSprite.position.z = 0.2;
			this.textSprite.visible = false;
			tSprite.add(this.textSprite);
		}

		this.sprite = tSprite;
		this._anchor = node;
		this.hasHover = false;

		this.on('hover', () => {
			this.hasHover = true;
			if (this.textSprite) {
				this.textSprite.visible = true;
			}
		});

		this.on('hoverOut', () => {
			this.hasHover = false;
			if (this.textSprite) {
				this.textSprite.visible = false;
			}
		});
	}
	util.inherits(GoTarget, EventEmitter);

	this.targets = {};

	three.on('prerender', () => {
		const raycaster = new THREE.Raycaster();
		raycaster.setFromCamera(new THREE.Vector2(0,0), three.camera);
		const hits = raycaster.intersectObjects(this.getTargets().map(target => target.sprite));

		let target = false;

		if (hits.length) {

			// Show hidden text sprite child
			target = this.getTarget(hits[0].object.name);
			if (target) target.emit('hover');
		}

		// if it is not the one just marked for highlight
		// and it used to be highlighted un highlight it.
		Object.keys(this.targets)
		.map(key => this.targets[key])
		.filter(eachTarget => eachTarget !== target)
		.forEach(eachNotHit => {
			if (eachNotHit.hasHover) eachNotHit.emit('hoverOut');
		});
	});

	const interact = (event) => {
		Object.keys(this.targets)
		.forEach(target => {
			if (target.hasHover) target.emit(event.type);
		});
	};

	window.addEventListener('click', interact);
	window.addEventListener('mousedown', interact);
	window.addEventListener('mouseup', interact);
	window.addEventListener('touchdown', interact);
	window.addEventListener('touchup', interact);

	this.getTarget = (id) => {
		return this.targets[id];
	};

	this.addTarget = (node) => {

		const id = node.name;
		if (!config[id]) throw('No Config For ' + id);
		this.targets[id] = new GoTarget(config[id], node);
		window.targets = this.targets;
	};

	this.getTargets = () => Object.keys(this.targets).map(k => this.targets[k]);
};
