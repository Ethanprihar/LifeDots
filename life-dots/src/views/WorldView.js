import React from "react";
import ReactModal from 'react-modal';

import WorldOverlayView from "./WorldOverlayView";

import DotView from "./DotView";
import FoodView from "./FoodView";
import TrapView from "./TrapView";
import WallView from "./WallView";

var LZString = require("lz-string")
var localforage = require("localforage")
var JsonPorter = require('json-porter').default;

const modal_style = 
{
    overlay: 
    {
        backgroundColor: 'rgba(255, 255, 255, 0.25)'
    },
    content: 
    {
        textAlign: "center",
        position: 'absolute',
        top: '25%',
        left: '10%',
        right: '10%',
        bottom: 'auto',
        border: "0.25vh solid #b3b3b3",
        backgroundColor: "#000000",
        borderRadius: "2vh",
    },
}

export default class WorldView extends React.Component
{   
    constructor(props)
    {
        super(props);
        let stats = {};
        stats.ticks = props.world.total_ticks;
        stats.dot_num =  Object.keys(props.world.dot_map).length;
        stats.avg_size = 0;
        stats.avg_split = 0;
        stats.avg_energy = 0;
        stats.avg_rest = 0;
        stats.avg_perc = 0;
        stats.avg_mut = 0;
        for (let key in props.world.dot_map)
        {
            stats.avg_size += props.world.dot_map[key].genome.max_size / stats.dot_num;
            stats.avg_split += props.world.dot_map[key].genome.split_frac / stats.dot_num;
            stats.avg_energy += props.world.dot_map[key].genome.eat_ratio / stats.dot_num;
            stats.avg_rest += props.world.dot_map[key].genome.speed / stats.dot_num;
            stats.avg_perc += props.world.dot_map[key].genome.view / stats.dot_num;
            stats.avg_mut += Math.abs(props.world.dot_map[key].genome.max_mut_pct) / stats.dot_num;
        }
        this.state = 
        {
            tick_time: props.tick_time,
            cell_size: props.cell_size,
            world: props.world,
            warned: false,
            waiting: false,
            overlay: true,
            stats: stats,
        };
        this.auto_save();
    }

    update_world()
    {
        if (!this.state.overlay)
        {
            this.state.world.update()
        }
        return this.state.world
    }

    componentDidMount()
    {
        this.world_interval = setInterval(() => this.setState({world: this.update_world()}), this.state.tick_time);
        this.save_interval = setInterval(() => this.auto_save(), 300000);
        document.addEventListener("keydown", this.open_overlay);
    }

    componentWillUnmount()
    {
        clearInterval(this.world_interval);
        clearInterval(this.save_interval);
        document.removeEventListener("keydown", this.open_overlay);
    }

    auto_save = () =>
    {
        this.setState({waiting: true})
        try
        {
            let save_string = LZString.compressToUTF16(JSON.stringify(this.state));
            localforage.setItem('world', save_string)
        }
        catch
        {
            if (!this.state.warned)
            {
                alert("This world is currently too large to save locally. Every 5 minutes another save will be attempted, but this will be your only alert.");
                this.setState({warned: true});
            }
        }
        this.setState({waiting: false})
    }

    open_overlay = (event) =>
    {
        event.preventDefault();
        let stats = {};
        stats.ticks = this.state.world.total_ticks;
        stats.dot_num =  Object.keys(this.state.world.dot_map).length;
        stats.avg_size = 0;
        stats.avg_split = 0;
        stats.avg_energy = 0;
        stats.avg_rest = 0;
        stats.avg_perc = 0;
        stats.avg_mut = 0;
        for (let key in this.state.world.dot_map)
        {
            stats.avg_size += this.state.world.dot_map[key].genome.max_size / stats.dot_num;
            stats.avg_split += this.state.world.dot_map[key].genome.split_frac / stats.dot_num;
            stats.avg_energy += this.state.world.dot_map[key].genome.eat_ratio / stats.dot_num;
            stats.avg_rest += this.state.world.dot_map[key].genome.speed / stats.dot_num;
            stats.avg_perc += this.state.world.dot_map[key].genome.view / stats.dot_num;
            stats.avg_mut += Math.abs(this.state.world.dot_map[key].genome.max_mut_pct) / stats.dot_num;
        }
        if (event.which === 32) //space
        {
            this.setState({overlay: true, stats: stats});
        }
    }

    close_overlay = (event) =>
    {
        event.preventDefault();
        if (event.which === 32) //space
        {
            this.setState({overlay: false});
        }
    }

    close_overlay_button = () =>
    {
        this.setState({overlay: false});
    }

    export = () =>
    {
        let jp = new JsonPorter();
        jp.export({cell_size: this.state.cell_size, 
                   tick_time: this.state.tick_time, 
                   world: this.state.world}, "lifedots-world.json");
    }
    
    render()
    {
        const trap_min = this.state.world.trap_placer.min_trap_damage;
        const trap_max = this.state.world.trap_placer.max_trap_damage * 2;
        const food_min = this.state.world.food_placer.min_food_per_drop;
        const food_max = this.state.world.food_placer.max_food_per_drop * 2;
        const dot_min = this.state.world.dot_placer.min_max_size;
        const dot_max = this.state.world.dot_placer.max_max_size;
        
        let components = [];
        for (let pos in this.state.world.wall_map)
        {
            let [r, c] = pos.split(",").map(Number);
            components.push(<WallView row={r}
                                      col={c}
                                      cell_size={this.state.cell_size}
                                      key={"wall" + pos}/>);
        }
        for (let pos in this.state.world.trap_map)
        {
            let [r, c] = pos.split(",").map(Number);
            components.push(<TrapView row={r}
                                      col={c}
                                      trap_min={trap_min}
                                      trap_max={trap_max}
                                      trap_size={this.state.world.trap_map[pos]}
                                      cell_size={this.state.cell_size}
                                      key={"trap" + pos}/>);
        }
        for (let pos in this.state.world.food_map)
        {
            let [r, c] = pos.split(",").map(Number);
            components.push(<FoodView row={r}
                                      col={c}
                                      food_min={food_min}
                                      food_max={food_max}
                                      food_size={this.state.world.food_map[pos]}
                                      cell_size={this.state.cell_size}
                                      key={"food" + pos}/>);
        }
        for (let pos in this.state.world.dot_map)
        {
            let [r, c] = pos.split(",").map(Number);
            let dot_color = this.state.world.dot_map[pos].genome.color;
            components.push(<DotView dot_color={dot_color}
                                        row={r}
                                        col={c}
                                        dot_min={dot_min}
                                        dot_max={dot_max}
                                        dot_size={this.state.world.dot_map[pos].genome.max_size}
                                        dot_signal={this.state.world.dot_map[pos].signal}
                                        cell_size={this.state.cell_size}
                                        key={"dot" + pos}/>);
        }
        return(
        <div>
            <ReactModal style={modal_style} isOpen={this.state.overlay} ariaHideApp={false}>
                <WorldOverlayView stats={this.state.stats} close_overlay={this.close_overlay} close_overlay_button={this.close_overlay_button} save={this.auto_save} export={this.export} setPage={this.props.setPage}/>
            </ReactModal>
            {components}
        </div>);
    }
}