// Dependencies
const { MessageEmbed, Message } = require('discord.js');
const fs = require('fs');
const config = require('../config.json');
const CatLoggr = require('cat-loggr');

// Functions
const log = new CatLoggr();
const generated = new Set();

module.exports = {
    name: 'gen', // Command name
    description: 'Generate a specified service if stocked.', // Command description

    /**
     * Command execute
     * @param {Message} message The message sent by the user
     * @param {Array[]} args Arguments split by spaces after the command name
     */
    execute(message, args) {
        // If the generator channel is not given in the config or invalid
        try {
            message.client.channels.cache.get(config.genChannel).id; // Try to get the channel's id
        } catch (error) {
            if (error) log.error(error); // If an error occurred, log to console

            // Send an error message if the "error_message" field is "true" in the configuration
            if (config.command.error_message === true) {
                const errorEmbed = new MessageEmbed()
                    .setColor(config.color.red)
                    .setTitle('Error occurred!')
                    .setDescription('Not a valid gen channel specified!')
                    .setFooter(message.author.tag, message.author.displayAvatarURL({ dynamic: true, size: 64 }))
                    .setTimestamp();

                return message.channel.send(errorEmbed);
            } else return;
        }

        // If the message channel id is the generator channel id in the configuration
        if (message.channel.id === config.genChannel) {
            // If the user has cooldown on the command
            if (generated.has(message.author.id)) {
                const cooldownEmbed = new MessageEmbed()
                    .setColor(config.color.red)
                    .setTitle('Cooldown!')
                    .setDescription('Please wait before executing that command again!')
                    .setFooter(message.author.tag, message.author.displayAvatarURL({ dynamic: true, size: 64 }))
                    .setTimestamp();

                return message.channel.send(cooldownEmbed);
            } else {
                // Parameters
                const service = args[0];

                // If the "service" parameter is missing
                if (!service) {
                    const missingParamEmbed = new MessageEmbed()
                        .setColor(config.color.red)
                        .setTitle('Missing parameters!')
                        .setDescription('You need to give a service name!')
                        .setFooter(message.author.tag, message.author.displayAvatarURL({ dynamic: true, size: 64 }))
                        .setTimestamp();

                    return message.channel.send(missingParamEmbed);
                }

                // File path to find the given service
                const filePath = `${__dirname}/../stock/${args[0]}.txt`;

                // Read the service file
                fs.readFile(filePath, function (error, data) {
                    // If no error
                    if (!error) {
                        data = data.toString(); // Stringify the content

                        const position = data.toString().indexOf('\n'); // Get position
                        const firstLine = data.split('\n')[0]; // Get the first line

                        // If the service file is empty
                        if (position === -1) {
                            const notFoundEmbed = new MessageEmbed()
                                .setColor(config.color.red)
                                .setTitle('Generator error!')
                                .setDescription(`I do not find the \`${args[0]}\` service in my stock!`)
                                .setFooter(message.author.tag, message.author.displayAvatarURL({ dynamic: true, size: 64 }))
                                .setTimestamp();

                            return message.channel.send(notFoundEmbed);
                        }

                        // Send messages to the user
                        const generatedEmbed = new MessageEmbed()
                            .setColor(config.color.green)
                            .setTitle('**🌹 Chroma Gen**')
                            .setDescription('✅ Account Generated Successfully!')
                            .addField('📜 Service', `\`${args[0][0].toUpperCase()}${args[0].slice(1).toLowerCase()}\``, true)
                            .addField('🔒 Account', `\`${firstLine}\``, true)
                            .addField('⚡ Account Details', `\`${firstLine}\``)
                            .addField('⚠️ The Accounts generated have 60% to 80% chance of working')
                            .setFooter('Developed with 💖 by AviDaddy')
                            .setTimestamp();

                        message.author.send(generatedEmbed);


                        // Send message to the channel if the user received the message
                        if (position !== -1) {
                            data = data.substr(position + 1); // Remove the generated account line

                            // Write changes
                            fs.writeFile(filePath, data, function (error) {
                                const successEmbed = new MessageEmbed()
                                    .setColor(config.color.green)
                                    .setTitle('Account generated successfully!')
                                    .setDescription(`Check your private messages, ${message.author}! *If you did not receive the message, please unlock your private messages!*`)
                                    .setFooter(message.author.tag, message.author.displayAvatarURL({ dynamic: true, size: 64 }))
                                    .setTimestamp();

                                message.channel.send(successEmbed);

                                generated.add(message.author.id); // Add user to the cooldown set

                                // Set cooldown time
                                setTimeout(() => {
                                    generated.delete(message.author.id); // Remove the user from the cooldown set after expiration
                                }, config.genCooldown);

                                if (error) return log.error(error); // If an error occurred, log to console
                            });
                        } else {
                            // If the service is empty
                            const emptyServiceEmbed = new MessageEmbed()
                                .setColor(config.color.red)
                                .setTitle('Generator error!')
                                .setDescription(`The \`${args[0]}\` service is empty!`)
                                .setFooter(message.author.tag, message.author.displayAvatarURL({ dynamic: true, size: 64 }))
                                .setTimestamp();

                            return message.channel.send(emptyServiceEmbed);
                        }
                    } else {
                        // If the service does not exist
                        const notExistEmbed = new MessageEmbed()
                            .setColor(config.color.red)
                            .setTitle('Generator error!')
                            .setDescription(`Service \`${args[0]}\` does not exist!`)
                            .setFooter(message.author.tag, message.author.displayAvatarURL({ dynamic: true, size: 64 }))
                            .setTimestamp();

                        return message.channel.send(notExistEmbed);
                    }
                });
            }
        } else {
            // If the command executed in another channel
            const wrongChannelEmbed = new MessageEmbed()
                .setColor(config.color.red)
                .setTitle('Wrong command usage!')
                .setDescription(`You cannot use the \`gen\` command in this channel! Try it in <#${config.genChannel}>!`)
                .setFooter(message.author.tag, message.author.displayAvatarURL({ dynamic: true, size: 64 }))
                .setTimestamp();

            return message.channel.send(wrongChannelEmbed);
        }
    }
};
